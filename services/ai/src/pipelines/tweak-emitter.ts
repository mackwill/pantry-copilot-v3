import { type AIRecipePartial, aiRecipePartialSchema, aiRecipeSchema } from '@pantry/contracts';
import { parsePartialJson } from './partial-recipe.js';

export interface TweakSnapshot {
  /** The growing one-line summary, as far as it has streamed in. */
  summary: string | null;
  /** The updated recipe so far (defensively partial). */
  recipe: AIRecipePartial | null;
  /** True once `updatedRecipe` satisfies the full `aiRecipeSchema`. */
  complete: boolean;
}

const DEFAULT_THROTTLE_MS = 180;

/**
 * Accumulates the streaming `emit_tweak` tool-call JSON
 * (`{ summary, changes, updatedRecipe }`) and produces deduped, throttled
 * snapshots. Mirrors `RecipeEmitter`, but pulls two things out of the one
 * object: the live `summary` prose and the `updatedRecipe` partial. Because
 * the tool schema orders `summary` first, it streams (and completes) before
 * the recipe body — so the panel types the summary, then fills the doc.
 */
export class TweakEmitter {
  private accumulated = '';
  private lastSerialized: string | null = null;
  private lastEmitAt = Number.NEGATIVE_INFINITY;

  constructor(private readonly throttleMs: number = DEFAULT_THROTTLE_MS) {}

  feed(fragment: string, now: number): TweakSnapshot | null {
    if (fragment) this.accumulated += fragment;
    if (now - this.lastEmitAt < this.throttleMs) return null;
    const snapshot = this.snapshot();
    if (!snapshot) return null;
    const serialized = JSON.stringify(snapshot);
    if (serialized === this.lastSerialized) return null;
    this.lastSerialized = serialized;
    this.lastEmitAt = now;
    return snapshot;
  }

  flush(): TweakSnapshot | null {
    const snapshot = this.snapshot();
    if (!snapshot) return null;
    this.lastSerialized = JSON.stringify(snapshot);
    return snapshot;
  }

  private snapshot(): TweakSnapshot | null {
    const parsed = parsePartialJson(this.accumulated);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const obj = parsed as Record<string, unknown>;

    const summary = typeof obj['summary'] === 'string' ? obj['summary'] : null;

    let recipe: AIRecipePartial | null = null;
    let complete = false;
    const updated = obj['updatedRecipe'];
    if (updated && typeof updated === 'object' && !Array.isArray(updated)) {
      const partial = aiRecipePartialSchema.safeParse(updated);
      if (partial.success) {
        recipe = partial.data;
        complete = aiRecipeSchema.safeParse(updated).success;
      }
    }

    if (summary === null && recipe === null) return null;
    return { summary, recipe, complete };
  }
}
