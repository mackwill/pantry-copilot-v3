import { expect, test, type Page } from '@playwright/test';

const uniqueEmail = (): string =>
  `e2e-${Date.now().toString()}-${Math.floor(Math.random() * 1_000_000).toString()}@example.com`;

/** Interacting before React hydrates would native-submit the SSR form;
 *  hydrated nodes carry React's internal __react* expando keys. */
async function gotoHydrated(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForFunction(() => {
    const btn = document.querySelector('button[type=submit]');
    return btn !== null && Object.keys(btn).some((key) => key.startsWith('__react'));
  });
}

test('unauthenticated /home redirects to /login', async ({ page }) => {
  await page.goto('/home');
  await expect(page).toHaveURL(/\/login/);
});

test('sign up → authed home → sign back in', async ({ page }) => {
  const email = uniqueEmail();
  const password = 'hunter2hunter2';

  await gotoHydrated(page, '/signup');
  await page.getByLabel('Name').fill('E2E Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/home/);
  await expect(page.getByRole('heading', { name: 'E2E Tester' })).toBeVisible();

  // Session survives reload (SSR cookie path).
  await page.reload();
  await expect(page).toHaveURL(/\/home/);

  // Fresh context sign-in via the login form.
  await page.context().clearCookies();
  await gotoHydrated(page, '/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/home/);
});
