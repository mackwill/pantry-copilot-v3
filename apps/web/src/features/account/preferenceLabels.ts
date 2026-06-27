/** Human-readable label for a stored diet/allergy tag (e.g. `low_carb` → `Low carb`). */
export function tagLabel(tag: string): string {
  const spaced = tag.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
