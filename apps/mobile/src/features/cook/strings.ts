/** Mobile cook in-session + resume + consume strings (board §03.5 / §03 / §★). */
export const cookStrings = {
  cooking: 'Cooking',
  onTheStove: (meta: string): string => `On the stove · ${meta}`,
  resumeStepMeta: (step: number, total: number): string => `step ${step.toString()} of ${total.toString()}`,
  resume: 'Resume',
  stepOf: (step: number, total: number): string => `${step.toString()}/${total.toString()}`,
  stepLabel: (step: number, label?: string): string =>
    label === undefined ? `Step ${step.toString()}` : `Step ${step.toString()} · ${label}`,
  upNext: 'Up next',
  back: 'Back',
  next: 'Next',
  finish: 'Finish',
  untimed: 'No timer — go by feel',
  // End-of-cook ask
  youreDone: "You're done",
  plateIt: 'Plate it up.',
  didYouCook: 'Did you actually cook it?',
  cookBlurb: "Confirming updates your pantry — so tomorrow's suggestions know what's still in the fridge.",
  willDeduct: 'Will deduct from pantry',
  itemsCount: (n: number): string => `${n.toString()} ${n === 1 ? 'item' : 'items'}`,
  iCookedThis: 'I cooked this · update pantry',
  adjustUsed: 'Adjust what was used',
  notNow: 'Not now',
  finishesIt: 'finishes it',
  leftHint: (qty: string): string => `${qty} left`,
  // Consume sheet
  consumeEyebrow: 'Before we update your pantry',
  consumeTitle: 'What did you actually use?',
  consumeInfo:
    "Quantities are what the recipe called for. Tweak any that don't match what you actually used — leftovers stay in the pantry.",
  have: (qty: string): string => `have ${qty}`,
  usedItAll: 'Used it all',
  asRecipe: 'as recipe',
  usedMore: 'used more',
  usedLess: 'used less',
  deduct: 'Deduct from pantry',
  skip: "Skip — don't change pantry",
  notInPantry: "wasn't in pantry",
} as const;

/** Format a whole number of seconds as `m:ss`. */
export function formatTimer(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(safe / 60).toString()}:${(safe % 60).toString().padStart(2, '0')}`;
}
