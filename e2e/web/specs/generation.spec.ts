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

test('home → prompt → stream → result → branch re-runs (mock provider)', async ({ page }) => {
  await signUp(page);

  // Home → type a prompt → submit.
  await page.goto('/cook');
  await waitHydrated(page);
  await expect(page.getByText('What are you hungry for?')).toBeVisible();
  await page.getByLabel('Ask in your own words').fill('Cozy with milk and carrots, not too sweet');
  await page.getByRole('button', { name: 'Cook this' }).click();
  await expect(page).toHaveURL(/\/cook\/generate/);

  // Thinking beat streams (prose + tool calls).
  await expect(page.getByText('Thinking')).toBeVisible();
  await expect(page.getByText(/read_pantry/)).toBeVisible();

  // Drafting beat — single streaming recipe (no "Recipe 1 of 3"/queued cards).
  await expect(page.getByText('drafting', { exact: true })).toBeVisible();
  await expect(page.getByText(/of 3/)).toHaveCount(0);

  // Result — committed recipe + branch tiles.
  const recipeHeading = page.getByRole('heading', { name: 'Charred Scallion & Carrot Fried Rice' });
  await expect(recipeHeading).toBeVisible();
  await expect(page.getByRole('button', { name: /Start cooking/ })).toBeVisible();
  await expect(page.getByText('Weirder')).toBeVisible();

  // Tap a branch tile → a new generation runs (re-enters Thinking, then Result).
  await page.getByText('Weirder').click();
  await expect(page.getByText('Thinking')).toBeVisible();
  await expect(page.getByRole('button', { name: /Start cooking/ })).toBeVisible();
});
