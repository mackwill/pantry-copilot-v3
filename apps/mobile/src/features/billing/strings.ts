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
  /** Plan-comparison ("ledger") paywall (board `paywall-b` · MobilePaywallB). */
  compare: {
    eyebrow: 'Plans',
    headlineLead: 'Pick a plan.',
    headlineEmphasis: 'Or try Pro free.',
    body: 'Quotas reset weekly. Billed via RevenueCat.',
    restore: 'Restore',
    featureHeader: 'feature',
    bestBadge: 'Best',
    startTrial: 'Start 7-day free trial · Pro',
    chooseBasic: 'Choose Basic instead',
    /** Receipt-style comparison rows: basic / pro values. */
    rows: [
      { label: 'Generations / week', basic: '10', pro: '∞' },
      { label: 'Scans / week', basic: '5', pro: '∞' },
      { label: 'Weirdness', basic: 'adventurous', pro: 'chaotic' },
      { label: 'Household', basic: '1', pro: '5' },
      { label: 'Web access', basic: '✓', pro: '✓' },
      { label: 'Priority gen', basic: '—', pro: '✓' },
    ],
    /** Fine print under the CTAs; `{charge}` is filled with the day-8 charge. */
    finePrintLead: 'day 1–7 · free · day 8 · {charge}',
    finePrintTrail: 'reminder 2 days before · cancel any time',
    /** Day-8 charge amounts (USD), by billing period. */
    chargeAnnual: '79.00 USD',
    chargeMonthly: '9.99 USD',
  },
  /** Pre-trial limit-hit offer (board `paywall-b` §13 · MobileTrialOffer). */
  trialOffer: {
    eyebrowLimit: 'Weekly limit reached',
    quota: '3 of 3 generations · resets Sun',
    headlineLead: 'One more idea?',
    headlineEmphasis: 'Try Pro free for 7 days.',
    body:
      'Unlimited generations, scans, and the full weirdness slider. ' +
      "Cancel any time before day 8 and you won't be charged.",
    /** Mini quota visualization labels. */
    quotaCardHeader: 'This week · Free',
    quotaCardCount: '3 / 3',
    quotaResets: 'resets Sunday',
    quotaUpgrade: 'or upgrade for ∞',
    startTrial: 'Start 7-day free trial',
    seePlans: 'See plans · or wait til Sunday',
    finePrint: 'Free for 7 days, then $9.99/mo · cancel any time',
  },
  /** Trial-ending reminder (board `paywall-contextual` · MobileTrialEnding). */
  trialEnding: {
    eyebrow: 'Trial',
    badge: 'Trial ends in 2 days',
    countdownEmphasis: '2 days',
    countdownTrail: 'left of Pro.',
    timeline: 'started Apr 5 · billing starts May 3, 2026',
    progressDay: 'day 5 of 7',
    progressCharge: '$9.99 charged in 2 days',
    perksEyebrow: 'What Pro got you',
    /** Usage recap rows: [label, value, sub]. */
    perks: [
      { label: 'Recipes generated', value: '14', sub: 'on Free: 3 max' },
      { label: 'Pantry scans', value: '6', sub: 'on Free: 2 max' },
      { label: 'Weirdest dish', value: 'chaotic', sub: 'locked on Free' },
    ],
    keepPro: 'Keep Pro · $9.99/mo',
    switchAnnual: 'Switch to annual · save 33%',
    cancel: 'Cancel before billing',
    finePrint: 'Cancel any time in Settings · managed by RevenueCat',
  },
} as const;
