import {
  type AIGenerationRequest,
  type AIRecipe,
  aiRecipeSchema,
  type GenerationEvent,
  type RecipeToolName,
} from '@pantry/contracts';
import { RecipeEmitter } from '../pipelines/recipe-emitter.js';
import type { TokenUsage } from './types.js';

/**
 * Raw, provider-shaped lifecycle events. Each adapter (mock / anthropic /
 * openai) yields these; the orchestrator turns them into the canonical
 * `GenerationEvent` wire sequence. The model drives the narration —
 * `thinking_delta` carries reasoning prose, `tool_*` bracket each host
 * tool call, and the terminal `emit_recipe` streams as `recipe_fragment`s
 * piped through `RecipeEmitter`. `completed` carries the provider's final
 * parsed recipe + token usage.
 */
export type RawProviderEvent =
  | { type: 'thinking_delta'; text: string }
  | { type: 'tool_started'; id: string; name: RecipeToolName; display: string }
  | { type: 'tool_resolved'; id: string; name: RecipeToolName; result: string | null }
  | { type: 'tool_errored'; id: string; name: RecipeToolName; message: string }
  | { type: 'emit_recipe_started'; id: string }
  | { type: 'recipe_fragment'; fragment: string }
  | { type: 'completed'; recipe: AIRecipe; tokensUsed: TokenUsage };

export type RawProviderRunner = (req: AIGenerationRequest, signal: AbortSignal) => AsyncIterable<RawProviderEvent>;

/** Hard cap on agentic tool-call turns (excluding the terminal emit_recipe). */
export const MAX_TOOL_TURNS = 6;

const EMIT_DISPLAY = 'emit_recipe()';

/**
 * must = mustInclude ∪ pantry items expiring within 3 days; maybe = rest.
 * Server-derived so the UI panel populates before the model emits a token.
 */
export function computePullingFromSplit(req: AIGenerationRequest): { must: string[]; maybe: string[] } {
  const must = new Set<string>();
  for (const name of req.mustInclude) {
    const trimmed = name.trim();
    if (trimmed) must.add(trimmed);
  }
  for (const item of req.pantry) {
    if (item.expiresInDays != null && item.expiresInDays <= 3) must.add(item.name);
  }
  const seen = new Set([...must].map((m) => m.toLowerCase()));
  const maybe: string[] = [];
  for (const item of req.pantry) {
    if (!seen.has(item.name.toLowerCase())) {
      maybe.push(item.name);
      seen.add(item.name.toLowerCase());
    }
  }
  return { must: [...must], maybe };
}

export interface OrchestratorOptions {
  now?: () => number;
  /** Throttle window between `recipe_partial` emissions (ms). Tests pass 0. */
  partialThrottleMs?: number;
}

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
type EventBody = DistributiveOmit<GenerationEvent, 'seq' | 't'>;

/**
 * Wrap a raw provider runner with the canonical wire sequence:
 *
 *   pulling_from →
 *     (thinking_token | tool_event:pending → tool_event:complete)* →
 *     recipe_partial* →
 *     notice? →
 *     done
 *
 * On abort the stream terminates with `aborted`; on a missing/invalid
 * recipe with `error`. No events follow a terminal event.
 */
export async function* runRecipeStream(
  req: AIGenerationRequest,
  runRaw: RawProviderRunner,
  signal: AbortSignal,
  opts: OrchestratorOptions = {},
): AsyncIterable<GenerationEvent> {
  const now = opts.now ?? Date.now;
  const start = now();
  let seq = 0;
  const t = (): number => now() - start;
  const stamp = (body: EventBody): GenerationEvent => ({ ...body, seq: seq++, t: t() });
  // Read through a function so the getter is re-evaluated each call — a
  // bare `signal.aborted` gets control-flow-narrowed to `false` by TS.
  const isAborted = (): boolean => signal.aborted;

  if (isAborted()) {
    yield stamp({ type: 'aborted' });
    return;
  }

  const emitter = new RecipeEmitter(opts.partialThrottleMs ?? 180);
  const displayById = new Map<string, string>();
  let emitRecipeId: string | null = null;
  let toolTurns = 0;
  let recipe: AIRecipe | null = null;

  try {
    const split = computePullingFromSplit(req);
    yield stamp({ type: 'pulling_from', must: split.must, maybe: split.maybe });

    for await (const ev of runRaw(req, signal)) {
      if (isAborted()) {
        yield stamp({ type: 'aborted' });
        return;
      }
      switch (ev.type) {
        case 'thinking_delta': {
          if (ev.text.length === 0) break;
          yield stamp({ type: 'thinking_token', text: ev.text.slice(0, 4000) });
          break;
        }
        case 'tool_started': {
          toolTurns += 1;
          if (toolTurns > MAX_TOOL_TURNS) {
            yield stamp({ type: 'error', code: 'max_tool_turns', message: 'Exceeded tool-call budget.' });
            return;
          }
          displayById.set(ev.id, ev.display);
          yield stamp({ type: 'tool_event', id: ev.id, name: ev.name, state: 'pending', display: ev.display, result: null });
          break;
        }
        case 'tool_resolved': {
          const display = displayById.get(ev.id) ?? `${ev.name}()`;
          yield stamp({ type: 'tool_event', id: ev.id, name: ev.name, state: 'complete', display, result: ev.result });
          break;
        }
        case 'tool_errored': {
          const display = displayById.get(ev.id) ?? `${ev.name}()`;
          yield stamp({ type: 'tool_event', id: ev.id, name: ev.name, state: 'error', display, result: ev.message.slice(0, 200) });
          break;
        }
        case 'emit_recipe_started': {
          emitRecipeId = ev.id;
          displayById.set(ev.id, EMIT_DISPLAY);
          yield stamp({ type: 'tool_event', id: ev.id, name: 'emit_recipe', state: 'pending', display: EMIT_DISPLAY, result: null });
          break;
        }
        case 'recipe_fragment': {
          const snap = emitter.feed(ev.fragment, now());
          if (snap) yield stamp({ type: 'recipe_partial', recipe: snap.recipe, complete: snap.complete });
          break;
        }
        case 'completed': {
          recipe = ev.recipe;
          break;
        }
      }
    }

    if (isAborted()) {
      yield stamp({ type: 'aborted' });
      return;
    }

    if (!recipe) {
      yield stamp({ type: 'error', code: 'no_response', message: 'Provider stream completed without a recipe.' });
      return;
    }

    const validated = aiRecipeSchema.safeParse(recipe);
    if (!validated.success) {
      yield stamp({ type: 'error', code: 'invalid_response', message: validated.error.message.slice(0, 500) });
      return;
    }

    const final = emitter.flush();
    if (final) yield stamp({ type: 'recipe_partial', recipe: final.recipe, complete: final.complete });

    if (emitRecipeId) {
      yield stamp({ type: 'tool_event', id: emitRecipeId, name: 'emit_recipe', state: 'complete', display: EMIT_DISPLAY, result: 'recipe ready' });
    }

    if (validated.data.observation) {
      yield stamp({ type: 'notice', text: validated.data.observation });
    }

    yield stamp({ type: 'done', recipe: validated.data, recipeId: null });
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
