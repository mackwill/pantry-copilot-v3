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
} as const;
