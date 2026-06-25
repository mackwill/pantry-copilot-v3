import { expect, test, type Page } from '@playwright/test';
import { Client } from 'pg';

/**
 * M8 monetization happy path: a free user hits the weekly recipe limit →
 * the contextual LimitHitModal (board frame 5 · WebLimitHit) appears → the
 * upgrade CTA routes to the editorial paywall (board frame 1 · WebPaywallA)
 * → after entitlement is granted (RC webhook mirror, simulated by a direct
 * `user_subscriptions` insert) generation proceeds again with no modal.
 *
 * The free weekly recipe allowance is 3 (`AI_FREE_RECIPES_PER_WEEK`); we seed
 * the user up to it by inserting 3 `source='ai'` recipe rows for the current
 * week, deterministically, rather than running 3 live generations.
 */

const E2E_DATABASE_URL = (
  process.env['TEST_DATABASE_URL'] ?? 'postgres://pantry:pantry@localhost:5432/pantry'
).replace(/\/[^/]*$/, '/pantry_e2e');

const uniqueEmail = (): string =>
  `e2e-${Date.now().toString()}-${Math.floor(Math.random() * 1_000_000).toString()}@example.com`;

async function waitHydrated(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const btn = document.querySelector('button');
    return btn !== null && Object.keys(btn).some((key) => key.startsWith('__react'));
  });
}

/** Sign up a fresh user via the UI and return the email it registered with. */
async function signUp(page: Page): Promise<string> {
  const email = uniqueEmail();
  await page.goto('/signup');
  await page.waitForFunction(() => {
    const btn = document.querySelector('button[type=submit]');
    return btn !== null && Object.keys(btn).some((key) => key.startsWith('__react'));
  });
  await page.getByLabel('Name').fill('Mara Quinn');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('hunter2hunter2');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/home/);
  return email;
}

/** Open a fresh client against the e2e database (created by global-setup). */
async function dbClient(): Promise<Client> {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  return client;
}

async function userIdForEmail(client: Client, email: string): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    'SELECT id FROM users WHERE email = $1',
    [email],
  );
  const id = rows[0]?.id;
  if (id === undefined) throw new Error(`no user row for ${email}`);
  return id;
}

/** Seed N `source='ai'` recipes dated now, counting against the weekly quota. */
async function seedAiRecipes(client: Client, userId: string, count: number): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await client.query(
      `INSERT INTO recipes (user_id, prompt, weirdness, title, data, source, created_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, 'ai', now())`,
      [
        userId,
        `seed prompt ${i.toString()}`,
        2,
        `Seeded recipe ${i.toString()}`,
        JSON.stringify({
          title: `Seeded recipe ${i.toString()}`,
          summary: 'seeded for quota',
          ingredients: [],
          steps: [],
        }),
      ],
    );
  }
}

/** Grant Pro entitlement directly — stands in for an RC webhook unlock. */
async function grantPro(client: Client, userId: string): Promise<void> {
  await client.query(
    `INSERT INTO user_subscriptions (user_id, rc_app_user_id, tier, is_pro, sub_state)
     VALUES ($1, $1, 'pro', true, 'active')
     ON CONFLICT (user_id) DO UPDATE
       SET tier = 'pro', is_pro = true, sub_state = 'active'`,
    [userId],
  );
}

async function submitGeneration(page: Page): Promise<void> {
  await page.goto('/cook');
  await waitHydrated(page);
  await page.getByLabel('Ask in your own words').fill('Cozy with milk and carrots, not too sweet');
  await page.getByRole('button', { name: 'Cook this' }).click();
}

test('limit-hit modal → paywall → unlock lets generation proceed', async ({ page }) => {
  const email = await signUp(page);

  const client = await dbClient();
  try {
    const userId = await userIdForEmail(client, email);

    // Seed the user to the free weekly recipe limit (3).
    await seedAiRecipes(client, userId, 3);

    // A 4th generation is blocked → the contextual limit-hit modal appears.
    await submitGeneration(page);
    const modal = page.getByRole('dialog', { name: 'Weekly limit reached' });
    await expect(modal).toBeVisible();
    await expect(modal.getByText('One more idea?')).toBeVisible();
    await expect(
      modal.getByRole('button', { name: 'Start 7-day free trial' }),
    ).toBeVisible();

    // The upgrade CTA routes to the editorial paywall (board frame 1).
    await modal.getByRole('button', { name: 'Start 7-day free trial' }).click();
    await expect(page).toHaveURL(/\/upgrade/);
    await waitHydrated(page);
    await expect(page.getByText('your kitchen can do.')).toBeVisible();

    // Simulate the RC unlock: grant Pro entitlement server-side.
    await grantPro(client, userId);

    // Generation now proceeds — the stream enters Thinking, no modal.
    await submitGeneration(page);
    await expect(page).toHaveURL(/\/cook\/generate/);
    await expect(page.getByText('Thinking')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Weekly limit reached' })).toHaveCount(0);
  } finally {
    await client.end();
  }
});
