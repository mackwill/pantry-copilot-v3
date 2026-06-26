// M8 web frames: the two paywall variants, the contextual limit-hit modal, the
// trial-ending page, and the Pro-active subscription view in settings.
//
// Order is deliberate: the limit-hit modal needs a FREE user whose weekly
// recipe quota is spent, so we capture it before seeding Pro (which lifts the
// quota to effectively unlimited and would suppress the modal).
import { launch, newPage, seedState, shoot, signUp, WEB } from './capture-web-lib';

const browser = await launch();
const page = await newPage(browser);

const email = await signUp(page);

// ── §11 Paywall A (editorial / onboarding) ──
await page.goto(`${WEB}/upgrade`, { waitUntil: 'networkidle' });
await page.getByText('Cook with everything').waitFor();
await shoot(page, 'paywall-variation-a--web-paywall-onboarding');

// ── §12 Paywall B (plan compare) ──
await page.goto(`${WEB}/upgrade?variant=compare`, { waitUntil: 'networkidle' });
await page.getByText('Pick a plan.').waitFor();
await shoot(page, 'paywall-variation-b--web-paywall-plan-compare');

// ── §14 Trial ending (static; loads user only) ──
await page.goto(`${WEB}/trial`, { waitUntil: 'networkidle' });
await page.getByText('Two days left of Pro.').waitFor();
await shoot(page, 'free-trial-lifecycle--web-trial-ending-page');

// ── §13 Contextual limit-hit modal (free user, quota spent) ──
await seedState({ email, exhaustRecipeQuota: true });
await page.goto(`${WEB}/cook/generate?prompt=Anything%20cozy&weirdness=40`, { waitUntil: 'networkidle' });
await page.getByText('Weekly limit reached').waitFor();
await shoot(page, 'contextual-paywalls--web-limit-hit-modal');

// ── §15 Subscription in settings — Pro active ──
await seedState({ email, subscription: 'pro' });
await page.goto(`${WEB}/settings`, { waitUntil: 'networkidle' });
await page.getByText('Current plan').waitFor();
await shoot(page, 'subscription-in-settings--web-settings-subscription-pro-active');

await browser.close();
