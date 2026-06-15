import type { AIGenerationRequest, GenerationEvent } from '@pantry/contracts';
import { describe, expect, it, vi } from 'vitest';
import { createHttpAiStreamClient } from './ai-stream-client.js';

const REQ: AIGenerationRequest = { prompt: 'soup', weirdness: 20, pantry: [], mustInclude: [] };

function sseBody(frames: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const f of frames) controller.enqueue(enc.encode(f));
      controller.close();
    },
  });
}

function frame(ev: object): string {
  return `event: x\ndata: ${JSON.stringify(ev)}\n\n`;
}

async function collect(it: AsyncIterable<GenerationEvent>): Promise<GenerationEvent[]> {
  const out: GenerationEvent[] = [];
  for await (const e of it) out.push(e);
  return out;
}

describe('createHttpAiStreamClient', () => {
  it('parses validated events, ignoring heartbeats and invalid frames', async () => {
    const body = sseBody([
      ': hb\n\n',
      frame({ type: 'pulling_from', must: ['Spinach'], maybe: [], seq: 0, t: 0 }),
      'event: bogus\ndata: {not json}\n\n',
      frame({ type: 'aborted', seq: 1, t: 5 }),
    ]);
    const fetchImpl = vi.fn().mockResolvedValue(new Response(body, { status: 200 }));
    const client = createHttpAiStreamClient({ baseUrl: 'http://ai', token: 't', fetchImpl });
    const events = await collect(client.streamGeneration(REQ, { requestId: 'r1', signal: new AbortController().signal }));
    expect(events.map((e) => e.type)).toEqual(['pulling_from', 'aborted']);
  });

  it('handles a frame split across chunk boundaries', async () => {
    const full = frame({ type: 'notice', text: 'hi', seq: 0, t: 0 });
    const mid = Math.floor(full.length / 2);
    const body = sseBody([full.slice(0, mid), full.slice(mid)]);
    const fetchImpl = vi.fn().mockResolvedValue(new Response(body, { status: 200 }));
    const client = createHttpAiStreamClient({ baseUrl: 'http://ai', token: 't', fetchImpl });
    const events = await collect(client.streamGeneration(REQ, { requestId: 'r1', signal: new AbortController().signal }));
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('notice');
  });

  it('sends the bearer token and request id', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(sseBody([]), { status: 200 }));
    const client = createHttpAiStreamClient({ baseUrl: 'http://ai', token: 'secret', fetchImpl });
    await collect(client.streamGeneration(REQ, { requestId: 'req-42', signal: new AbortController().signal }));
    const headers = (fetchImpl.mock.calls[0]?.[1] as RequestInit).headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer secret');
    expect(headers['x-request-id']).toBe('req-42');
  });

  it('throws on a non-ok response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('nope', { status: 401 }));
    const client = createHttpAiStreamClient({ baseUrl: 'http://ai', token: 't', fetchImpl });
    await expect(collect(client.streamGeneration(REQ, { requestId: 'r', signal: new AbortController().signal }))).rejects.toThrow(/401/);
  });

  it('cancels the upstream fetch when the caller signal aborts', async () => {
    const ctrl = new AbortController();
    const fetchImpl = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        (init.signal as AbortSignal).addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'));
        });
      });
    });
    const client = createHttpAiStreamClient({ baseUrl: 'http://ai', token: 't', fetchImpl });
    const promise = collect(client.streamGeneration(REQ, { requestId: 'r', signal: ctrl.signal }));
    ctrl.abort();
    await expect(promise).rejects.toThrow(/abort/i);
  });
});
