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
}

test('generate → library → detail → favorite persists', async ({ page }) => {
  await signUp(page);
  await generateRecipe(page);

  // The recipe is persisted — it shows up in the library.
  await page.goto('/recipes');
  await waitHydrated(page);
  const card = page.getByRole('link', { name: new RegExp(RECIPE_TITLE) });
  await expect(card).toBeVisible();

  // Open the detail page.
  await card.first().click();
  await expect(page).toHaveURL(/\/recipes\/[0-9a-f-]{36}/);
  await expect(page.getByRole('heading', { name: RECIPE_TITLE })).toBeVisible();
  await expect(page.getByText(/in pantry/)).toBeVisible();

  // Favorite it, then reload — the Save button reflects the persisted state.
  await page.getByRole('button', { name: /Save/ }).click();
  await expect(page.getByRole('button', { name: /Saved/ })).toBeVisible();
  await page.reload();
  await waitHydrated(page);
  await expect(page.getByRole('button', { name: /Saved/ })).toBeVisible();

  // It surfaces under the Favorites filter back in the library.
  await page.goto('/recipes');
  await waitHydrated(page);
  await page.getByRole('button', { name: 'Favorites' }).click();
  await expect(page.getByRole('link', { name: new RegExp(RECIPE_TITLE) })).toBeVisible();
});
