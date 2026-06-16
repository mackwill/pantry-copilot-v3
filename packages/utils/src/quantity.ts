/** Result of deducting a consumed quantity from a pantry item's stock. */
export interface DeductionResult {
  /** Quantity left after the deduction, clamped at zero and rounded to the
   *  pantry's numeric(10,2) storage precision. */
  remaining: number;
  /** True when the item is used up and the consume transaction should remove
   *  it from the pantry. */
  finished: boolean;
}

/** Round to the two-decimal precision the pantry `quantity` column stores. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Deduct a consumed `used` quantity from an on-hand `have` quantity.
 *
 * Both quantities are assumed to share the pantry item's unit (an item carries
 * a single unit), so the math is unit-agnostic at the pantry's fixed 2-decimal
 * precision. Over-use is clamped to zero — you can't owe pantry stock — and a
 * negative `used` is treated as zero. Using all (or more) leaves nothing,
 * which marks the item finished.
 */
export function deduct(have: number, used: number): DeductionResult {
  const safeHave = Math.max(0, have);
  const safeUsed = Math.max(0, used);
  const remaining = round2(Math.max(0, safeHave - safeUsed));
  return { remaining, finished: remaining === 0 };
}
