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
const TWEAKED_TITLE = 'Charred Scallion & Carrot Fried Rice with Greens';
const TWEAK_SUMMARY = 'Lighter on the butter, with a handful of greens stirred through at the end.';

async function generateRecipe(page: Page): Promise<void> {
  await page.goto('/cook');
  await waitHydrated(page);
  await page.getByLabel('Ask in your own words').fill('Cozy with milk and carrots, not too sweet');
  await page.getByRole('button', { name: 'Cook this' }).click();
  await expect(page).toHaveURL(/\/cook\/generate/);
  await expect(page.getByRole('heading', { name: RECIPE_TITLE })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible({ timeout: 20_000 });
}

test('tweak a recipe → applied version persists across reload → revert restores original', async ({ page }) => {
  await signUp(page);
  await generateRecipe(page);

  // Open the recipe and enter the co-pilot.
  await page.goto('/recipes');
  await waitHydrated(page);
  await page.getByRole('link', { name: new RegExp(RECIPE_TITLE) }).first().click();
  await expect(page).toHaveURL(/\/recipes\/[0-9a-f-]{36}/);
  await page.getByRole('button', { name: 'Tweak this recipe' }).click();
  await expect(page).toHaveURL(/\?chat=true/);

  // Send a tweak; the mock streams the canned "lighter, greener" response.
  await page.getByPlaceholder('Try: "no nuts, kid\'s allergy"').fill('less butter, more greens');
  await page.getByRole('button', { name: 'Send tweak' }).click();

  // The summary + a change chip land, the doc swaps to the tweaked recipe, and
  // the version pill reads v2 · 1 tweak.
  await expect(page.getByText(TWEAK_SUMMARY)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Halved the butter to 1 tsp')).toBeVisible();
  await expect(page.getByRole('heading', { name: TWEAKED_TITLE })).toBeVisible();
  await expect(page.getByText('Baby spinach')).toBeVisible();
  await expect(page.getByText('1 tweak', { exact: false })).toBeVisible();

  // Reload — the applied version is persisted (title + thread survive).
  await page.reload();
  await waitHydrated(page);
  await expect(page.getByRole('heading', { name: TWEAKED_TITLE })).toBeVisible();
  await expect(page.getByText(TWEAK_SUMMARY)).toBeVisible();

  // Revert restores the original recipe and clears the thread.
  await page.getByRole('button', { name: 'Revert to original' }).click();
  await expect(page.getByRole('heading', { name: RECIPE_TITLE })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Baby spinach')).toHaveCount(0);
});
