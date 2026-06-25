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
} as const;
