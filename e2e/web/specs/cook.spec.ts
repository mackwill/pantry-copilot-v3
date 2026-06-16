import { expect, test, type Page } from '@playwright/test';

const uniqueEmail = (): string =>
  `e2e-${Date.now().toString()}-${Math.floor(Math.random() * 1_000_000).toString()}@example.com`;

async function waitHydrated(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const btn = document.querySelector('button');
    return btn !== null && Object.keys(btn).some((key) => key.startsWith('__react'));
  });
}

async function signUp(page: Page): Promise<void> {
  await page.goto('/signup');
  await page.waitForFunction(() => {
    const btn = document.querySelector('button[type=submit]');
    return btn !== null && Object.keys(btn).some((key) => key.startsWith('__react'));
  });
  await page.getByLabel('Name').fill('Mara Quinn');
  await page.getByLabel('Email').fill(uniqueEmail());
  await page.getByLabel('Password').fill('hunter2hunter2');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/home/);
}

const RECIPE_TITLE = 'Charred Scallion & Carrot Fried Rice';

async function generateRecipe(page: Page): Promise<void> {
  await page.goto('/cook');
  await waitHydrated(page);
  await page.getByLabel('Ask in your own words').fill('Cozy with milk and carrots, not too sweet');
  await page.getByRole('button', { name: 'Cook this' }).click();
  await expect(page).toHaveURL(/\/cook\/generate/);
  await expect(page.getByRole('heading', { name: RECIPE_TITLE })).toBeVisible();
  // Wait for the stream to finish (result actions appear only once the recipe
  // is persisted) before leaving — navigating mid-stream aborts the job.
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible({ timeout: 20_000 });
}

test('start cooking → step → finish, with a resume banner mid-session', async ({ page }) => {
  await signUp(page);
  await generateRecipe(page);

  // Open the recipe and start a cook session.
  await page.goto('/recipes');
  await waitHydrated(page);
  await page.getByRole('link', { name: new RegExp(RECIPE_TITLE) }).first().click();
  await expect(page).toHaveURL(/\/recipes\/[0-9a-f-]{36}/);
  await page.getByRole('button', { name: 'Start cooking' }).click();

  // In session: the inverse banner + the first step heading.
  await expect(page).toHaveURL(/\/cook\/session/);
  await expect(page.getByText('Cooking now')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Melt the butter/ })).toBeVisible();

  // The library shows a resume banner while the session is active.
  await page.goto('/recipes');
  await waitHydrated(page);
  await expect(page.getByText('Cooking now')).toBeVisible();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page).toHaveURL(/\/cook\/session/);

  // Step through to the end and finish.
  await waitHydrated(page);
  for (let i = 0; i < 10; i += 1) {
    const finish = page.getByRole('button', { name: 'Finish cooking' });
    if (await finish.isVisible().catch(() => false)) break;
    await page.getByRole('button', { name: /^Next$/ }).click();
  }
  await page.getByRole('button', { name: 'Finish cooking' }).click();
  await expect(page).toHaveURL(/\/recipes/);

  // Session is complete — no resume banner remains.
  await waitHydrated(page);
  await expect(page.getByText('Cooking now')).toHaveCount(0);
});
