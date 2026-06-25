/**
 * User-facing copy for the mobile billing / paywall feature (board `paywall-a`
 * · MobilePaywallA). Single object with nested groups; later subagents extend
 * it (trial offer, trial ending, limit-hit sheet, subscription section).
 */

export const billingStrings = {
  toggle: {
    monthly: 'Monthly',
    /** Annual segment label — includes the headline savings hint from the board. */
    annual: 'Annual · save 33%',
  },
  paywall: {
    eyebrow: 'Pantry CoPilot · Pro',
    headlineLead: 'Cook with everything',
    headlineEmphasis: 'your kitchen can do.',
    body:
      'Unlimited generations, unlimited scans, the full weirdness slider, ' +
      'household sharing. Try Pro free for seven days.',
    close: 'Close',
    restore: 'Restore',
    foodSlotHero: 'hero · serif-led dish',
    startTrial: 'Start 7-day free trial',
    /** Feature highlight list beneath the plan rows. */
    features: [
      'Unlimited recipe generations',
      'Unlimited pantry & receipt scans',
      'Full weirdness — chaotic evil unlocked',
      'Household sharing · up to 5 people',
      'Sync across web + iPhone',
    ],
    /** Fine print under the CTA; `{price}` is filled with the annual/monthly price. */
    finePrintLead: 'Free for 7 days, then {price}.',
    finePrintTrail: 'Cancel any time in Settings · billed via RevenueCat',
  },
  planOption: {
    /** Badge shown on the highlighted (Pro) option. */
    popularBadge: 'Best value',
    perMonth: '/mo',
    perYear: '/yr',
    /** Per-plan tagline shown beneath the plan name (mobile single-line). */
    tagline: {
      basic: '10 generations · 5 scans / wk',
      pro: 'Unlimited · household sharing · full weirdness',
    },
  },
} as const;
