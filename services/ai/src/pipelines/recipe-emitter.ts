import { type AIRecipePartial, aiRecipeSchema } from '@pantry/contracts';
import { parsePartialRecipe } from './partial-recipe.js';

export interface RecipeSnapshot {
  recipe: AIRecipePartial;
  /** True once the snapshot satisfies the full `aiRecipeSchema`. */
  complete: boolean;
}

const DEFAULT_THROTTLE_MS = 180;

/**
 * Accumulates streaming JSON fragments from the `emit_recipe` tool-call
 * and produces deduped, throttled snapshots of the single recipe.
 *
 * - `feed(fragment, now)` appends and, if the throttle window allows and
 *   the parsed snapshot changed since the last emission, returns it.
 * - `flush()` bypasses the throttle and always returns the latest
 *   parseable state, guaranteeing the final snapshot lands before `done`.
 */
export class RecipeEmitter {
  private accumulated = '';
  private lastSerialized: string | null = null;
  private lastEmitAt = Number.NEGATIVE_INFINITY;

  constructor(private readonly throttleMs: number = DEFAULT_THROTTLE_MS) {}

  feed(fragment: string, now: number): RecipeSnapshot | null {
    if (fragment) this.accumulated += fragment;
    if (now - this.lastEmitAt < this.throttleMs) return null;
    const snapshot = this.snapshot();
    if (!snapshot) return null;
    const serialized = JSON.stringify(snapshot.recipe);
    if (serialized === this.lastSerialized) return null;
    this.lastSerialized = serialized;
    this.lastEmitAt = now;
    return snapshot;
  }

  flush(): RecipeSnapshot | null {
    const snapshot = this.snapshot();
    if (!snapshot) return null;
    this.lastSerialized = JSON.stringify(snapshot.recipe);
    return snapshot;
  }

  private snapshot(): RecipeSnapshot | null {
    const recipe = parsePartialRecipe(this.accumulated);
    if (!recipe) return null;
    return { recipe, complete: aiRecipeSchema.safeParse(recipe).success };
  }
}
