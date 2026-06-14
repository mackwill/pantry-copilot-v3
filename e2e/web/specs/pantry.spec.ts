import { expect, test, type Page } from '@playwright/test';

const uniqueEmail = (): string =>
  `e2e-${Date.now().toString()}-${Math.floor(Math.random() * 1_000_000).toString()}@example.com`;

/** Interacting before React hydrates would no-op onClick handlers (or native-submit
 *  SSR forms); hydrated nodes carry React's internal __react* expando keys. */
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
  await page.getByLabel('Name').fill('Pantry Tester');
  await page.getByLabel('Email').fill(uniqueEmail());
  await page.getByLabel('Password').fill('hunter2hunter2');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/home/);
}

test('add → edit → delete a pantry item', async ({ page }) => {
  await signUp(page);

  await page.goto('/pantry');
  await waitHydrated(page);
  await expect(page.getByRole('heading', { name: 'Your pantry' })).toBeVisible();

  // Add
  await page.getByRole('button', { name: 'Add ingredient' }).click();
  await expect(page).toHaveURL(/\/pantry\/new/);
  await page.getByLabel('Name').fill('Whole milk');
  await page.getByLabel('Quantity').fill('1');
  await page.getByLabel('Unit').selectOption('gallon');
  await page.getByLabel('Category').selectOption('dairy');
  await page.getByLabel('Location').selectOption('fridge_top');
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page).toHaveURL(/\/pantry$/);
  await expect(page.getByRole('button', { name: 'Whole milk' })).toBeVisible();

  // Edit
  await page.getByRole('button', { name: 'Whole milk' }).click();
  await expect(page).toHaveURL(/\/pantry\/[0-9a-f-]+/);
  await page.getByLabel('Name').fill('Skim milk');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page).toHaveURL(/\/pantry$/);
  await expect(page.getByRole('button', { name: 'Skim milk' })).toBeVisible();

  // Delete
  await page.getByRole('button', { name: 'Skim milk' }).click();
  await page.getByRole('button', { name: 'Remove from pantry' }).click();
  await expect(page).toHaveURL(/\/pantry$/);
  await expect(page.getByRole('button', { name: 'Skim milk' })).toHaveCount(0);
});
