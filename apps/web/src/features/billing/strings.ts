/**
 * User-facing copy for the billing / paywall feature (board §11–§15, paywall-a).
 * Single object with nested groups; later subagents extend it.
 */

export const billingStrings = {
  toggle: {
    monthly: 'Monthly',
    /** Annual segment label — includes the headline savings hint from the board. */
    annual: 'Annual · save 33%',
    /** Accessible label for the segmented control. */
    ariaLabel: 'Billing period',
  },
  planCard: {
    /** Badge shown on the highlighted (Pro) card. */
    popularBadge: 'Best value',
    perMonth: '/mo',
    perYear: '/yr',
    /** Prefix for the annual savings line, e.g. "save 33%". */
    savePrefix: 'save',
    cta: {
      basic: 'Choose Basic',
      pro: 'Start 7-day free trial',
    },
    blurb: {
      basic: 'More than the trial allows. For weekday rhythms.',
      pro: 'The full copilot. For households that cook a lot.',
    },
  },
  paywall: {
    eyebrow: 'Pantry CoPilot · Pro',
    headlineLead: 'Cook with everything',
    headlineEmphasis: 'your kitchen can do.',
    body:
      'Unlimited recipe generations, unlimited pantry scans, the full weirdness range, ' +
      'and your household in one place. Try Pro free for seven days — then keep it for ' +
      'less than a takeout side.',
    maybeLater: 'Maybe later',
    reassurance: '7-day free trial · cancel any time · via RevenueCat',
    foodSlotHero: 'hero · adventurous dish',
    restorePrefix: 'Already subscribed?',
    restoreCta: 'Restore purchase',
    compareCta: 'Compare all features →',
    /** Three-up stat row beneath the lead copy. */
    stats: [
      { value: 'unlimited', label: 'recipe generations' },
      { value: 'unlimited', label: 'pantry & receipt scans' },
      { value: 'chaotic evil', label: 'weirdness unlocked' },
    ],
    /** Footer reassurance / social-proof row. */
    proof: [
      { stat: '4.8', sub: 'on the App Store · 2.1k ratings' },
      { stat: '7-day', sub: 'free trial · cancel before billing' },
      { stat: 'RevenueCat', sub: 'secure billing · App Store or Stripe' },
    ],
  },
  /** Plan-comparison / ledger screen (board paywall-b · WebPaywallB). */
  compare: {
    eyebrow: 'Plans · April 2026 pricing',
    headlineLead: 'Pick a plan.',
    headlineEmphasis: 'Or try Pro free.',
    close: 'Close',
    priceNote: 'prices in USD · billed via RevenueCat',
    compareLabel: '── compare ──',
    compareSub: 'Quotas reset every Sunday at midnight, your timezone.',
    totalLabel: '── total ──',
    bestValue: 'Best value',
    savePrefix: 'save',
    perYear: '/yr',
    perMonth: '/mo',
    /** Column headers — the three offer columns left to right. */
    columns: [
      {
        name: 'Free',
        priceMonthly: '0',
        priceAnnual: '0',
        save: '',
        cta: 'Stay on Free',
        best: false,
      },
      {
        name: 'Basic',
        priceMonthly: '4.99',
        priceAnnual: '39',
        save: '35%',
        cta: 'Choose Basic',
        best: false,
      },
      {
        name: 'Pro',
        priceMonthly: '9.99',
        priceAnnual: '79',
        save: '33%',
        cta: 'Start free trial',
        best: true,
      },
    ],
    /** Feature-comparison rows: free / basic / pro values. `true` renders a check. */
    rows: [
      { label: 'Recipe generations / week', free: '3', basic: '10', pro: 'unlimited' },
      { label: 'Pantry & receipt scans / wk', free: '2', basic: '5', pro: 'unlimited' },
      { label: 'Weirdness slider', free: 'curious', basic: 'adventurous', pro: 'chaotic evil' },
      { label: 'Saved recipes', free: '20', basic: '500', pro: 'unlimited' },
      { label: 'Household members', free: '1', basic: '1', pro: '5' },
      { label: 'Web access', free: '—', basic: true, pro: true },
      { label: 'Priority generation', free: '—', basic: '—', pro: true },
      { label: 'Export & print recipes', free: '—', basic: true, pro: true },
      { label: 'Shopping list auto-suggest', free: '—', basic: '—', pro: true },
    ],
    /** Receipt footer — trial summary + billing ledger. */
    receipt: {
      eyebrow: 'Your trial includes',
      headlineLead: 'Seven days of Pro.',
      headlineEmphasis: 'Cancel any time.',
      ledgerTrial: 'day 1–7 · trial period',
      ledgerChargeAnnual: 'day 8 · $79.00 USD/yr',
      ledgerChargeMonthly: 'day 8 · $9.99 USD/mo',
      ledgerReminder: 'reminder 2 days before',
    },
  },
  /** Limit-hit modal (board paywall-contextual · frame 5 · WebLimitHit). */
  limitHit: {
    /** Accessible label for the modal dialog. */
    ariaLabel: 'Weekly limit reached',
    eyebrow: 'Weekly limit reached',
    /** Quota sub-line beneath the eyebrow. */
    quota: '3 of 3 generations this week · resets Sunday',
    headlineLead: 'One more idea?',
    headlineEmphasis: 'Try Pro free for 7 days.',
    body:
      'Unlimited recipe generations, unlimited pantry scans, full weirdness slider, ' +
      "household sharing. Cancel any time before day 8 and you won't be charged.",
    /** Three-up perk row. */
    perks: [
      { value: '∞', label: 'generations' },
      { value: '∞', label: 'scans' },
      { value: 'chaotic evil', label: 'weirdness' },
    ],
    startTrial: 'Start 7-day free trial',
    seePlans: 'See plans',
    waitTilSunday: 'Wait til Sunday',
    close: 'Close',
    fineprint: 'Free 7 days · then $9.99/mo or $79/yr · cancel any time · billed via RevenueCat',
  },
  /** Trial-ending page (board paywall-contextual · frame 9 · WebTrialEnding). */
  trialEnding: {
    back: 'Back to dashboard',
    badge: 'Trial ends in 2 days',
    headlineLead: 'Two days left of Pro.',
    headlineEmphasis: 'Want to keep going?',
    body:
      "Your free trial ends Friday, May 3. You'll be billed $9.99 unless you cancel. " +
      'Switch to annual now and save 33%.',
    perksEyebrow: 'What Pro got you · last 5 days',
    /** Four-up usage recap: [value, label, sub]. */
    perks: [
      { value: '14', label: 'recipes generated', sub: 'on Free: 3 max' },
      { value: '6', label: 'pantry scans', sub: 'on Free: 2 max' },
      { value: 'chaotic', label: 'weirdest dish', sub: 'locked on Free' },
      { value: '3', label: 'household members', sub: 'locked on Free' },
    ],
    timelineEyebrow: 'Trial timeline',
    timeline: {
      start: 'started · Apr 26',
      today: 'day 5 of 7 · today',
      billing: 'billing · May 3 · $9.99',
    },
    keepPro: 'Keep Pro · $9.99/mo',
    switchAnnual: 'Switch to annual · save 33%',
    cancelTrial: 'Cancel trial',
  },
  /** Settings subscription rows (board subscription · frame 10 · WebSubscription). */
  subscription: {
    proEyebrow: 'Current plan',
    proTitle: 'Pantry CoPilot · Pro',
    proBlurb: 'Unlimited everything. Renews on the 3rd.',
    proManage: 'Manage',
    freeEyebrow: 'Currently on Free',
    freeTitle: 'Try Pro free for 7 days',
    freeBlurb: 'Unlimited generations, scans, household sharing.',
    freeCta: 'Start free trial',
    freeMeta: 'No charges until day 8',
    proBadge: 'Pro',
    /** Billing-details card. */
    billingTitle: 'Billing details',
    billingRows: {
      plan: 'Plan',
      renews: 'Renews',
      expires: 'Expires',
      amount: 'Amount',
      billedVia: 'Billed via',
      topUp: 'Top-up credits',
    },
    /** Change-plan card. */
    changeTitle: 'Change plan',
    switchAnnual: 'Switch to annual · save 33%',
    downgrade: 'Downgrade to Basic',
    cancel: 'Cancel subscription',
    fineprint:
      'Billing handled via App Store · restored automatically across devices through ' +
      'RevenueCat. Refunds via Apple within 14 days.',
    /** Fallback when a billing value is unknown. */
    unknown: '—',
  },
} as const;
