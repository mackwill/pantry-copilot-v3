import {
  type AITweakRequest,
  type RecipeTweakEvent,
  type RecipeTweakResponse,
  recipeTweakResponseSchema,
} from '@pantry/contracts';
import { TweakEmitter } from '../pipelines/tweak-emitter.js';
import type { TokenUsage } from './types.js';

/**
 * Raw, provider-shaped lifecycle events for a tweak turn. Each adapter
 * (mock / anthropic / openai) yields these; the orchestrator turns them into
 * the canonical `RecipeTweakEvent` wire sequence. The terminal `emit_tweak`
 * tool-call streams as `tweak_fragment`s piped through `TweakEmitter`;
 * `completed` carries the provider's final parsed response + token usage.
 */
export type RawTweakEvent =
  | { type: 'tweak_fragment'; fragment: string }
  | { type: 'completed'; response: RecipeTweakResponse; tokensUsed: TokenUsage };

export type RawTweakRunner = (req: AITweakRequest, signal: AbortSignal) => AsyncIterable<RawTweakEvent>;

export interface TweakOrchestratorOptions {
  now?: () => number;
  /** Throttle window between partial emissions (ms). Tests pass 0. */
  partialThrottleMs?: number;
}

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
type EventBody = DistributiveOmit<RecipeTweakEvent, 'seq' | 't'>;

/**
 * Wrap a raw tweak runner with the canonical wire sequence:
 *
 *   tweak_summary* → tweak_recipe_partial* → tweak_done
 *
 * `tweak_summary` carries the newly-streamed suffix of the summary (clients
 * concatenate); `tweak_recipe_partial` carries idempotent recipe snapshots.
 * On abort the stream terminates with `aborted`; on a missing/invalid
 * response with `error`. The persisted `recipeId`/`turn`/`version` on
 * `tweak_done` are placeholders the API overwrites.
 */
export async function* runTweakStream(
  req: AITweakRequest,
  runRaw: RawTweakRunner,
  signal: AbortSignal,
  opts: TweakOrchestratorOptions = {},
): AsyncIterable<RecipeTweakEvent> {
  const now = opts.now ?? Date.now;
  const start = now();
  let seq = 0;
  const t = (): number => now() - start;
  const stamp = (body: EventBody): RecipeTweakEvent => ({ ...body, seq: seq++, t: t() });
  const isAborted = (): boolean => signal.aborted;

  if (isAborted()) {
    yield stamp({ type: 'aborted' });
    return;
  }

  const emitter = new TweakEmitter(opts.partialThrottleMs ?? 180);
  let response: RecipeTweakResponse | null = null;
  let emittedSummary = '';
  let lastRecipeSerialized: string | null = null;

  // Emit the summary suffix (concatenation model) and any changed recipe
  // snapshot. Returns nothing — yields are inlined by the generator below.
  const summaryDelta = (summary: string | null): string | null => {
    if (summary === null) return null;
    if (summary === emittedSummary) return null;
    const delta = summary.startsWith(emittedSummary) ? summary.slice(emittedSummary.length) : summary;
    emittedSummary = summary;
    return delta.length > 0 ? delta : null;
  };
  const recipeChanged = (recipe: unknown): boolean => {
    if (recipe == null) return false;
    const serialized = JSON.stringify(recipe);
    if (serialized === lastRecipeSerialized) return false;
    lastRecipeSerialized = serialized;
    return true;
  };

  try {
    for await (const ev of runRaw(req, signal)) {
      if (isAborted()) {
        yield stamp({ type: 'aborted' });
        return;
      }
      if (ev.type === 'tweak_fragment') {
        const snap = emitter.feed(ev.fragment, now());
        if (!snap) continue;
        const delta = summaryDelta(snap.summary);
        if (delta !== null) yield stamp({ type: 'tweak_summary', text: delta.slice(0, 4000) });
        if (snap.recipe && recipeChanged(snap.recipe)) {
          yield stamp({ type: 'tweak_recipe_partial', recipe: snap.recipe, complete: snap.complete });
        }
      } else {
        response = ev.response;
      }
    }

    if (isAborted()) {
      yield stamp({ type: 'aborted' });
      return;
    }

    if (!response) {
      yield stamp({ type: 'error', code: 'no_response', message: 'Provider stream completed without a tweak.' });
      return;
    }

    const validated = recipeTweakResponseSchema.safeParse(response);
    if (!validated.success) {
      yield stamp({ type: 'error', code: 'invalid_response', message: validated.error.message.slice(0, 500) });
      return;
    }

    const final = emitter.flush();
    if (final) {
      const delta = summaryDelta(final.summary);
      if (delta !== null) yield stamp({ type: 'tweak_summary', text: delta.slice(0, 4000) });
      if (final.recipe && recipeChanged(final.recipe)) {
        yield stamp({ type: 'tweak_recipe_partial', recipe: final.recipe, complete: final.complete });
      }
    }

    yield stamp({ type: 'tweak_done', response: validated.data, recipeId: null, turn: 0, version: 1 });
  } catch (err) {
    if (isAborted() || (err instanceof Error && err.name === 'AbortError')) {
      yield stamp({ type: 'aborted' });
      return;
    }
    yield stamp({
      type: 'error',
      code: 'provider_error',
      message: err instanceof Error ? err.message.slice(0, 500) : 'unknown error',
    });
  }
}
