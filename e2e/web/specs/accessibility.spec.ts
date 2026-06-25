import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const uniqueEmail = (): string =>
  `a11y-${Date.now().toString()}-${Math.floor(Math.random() * 1_000_000).toString()}@example.com`;

/** Interacting before React hydrates would native-submit the SSR form. */
async function gotoHydrated(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForFunction(() => {
    const btn = document.querySelector('button[type=submit]');
    return btn !== null && Object.keys(btn).some((key) => key.startsWith('__react'));
  });
}

async function signIn(page: Page): Promise<void> {
  await gotoHydrated(page, '/signup');
  await page.getByLabel('Name').fill('A11y Tester');
  await page.getByLabel('Email').fill(uniqueEmail());
  await page.getByLabel('Password').fill('hunter2hunter2');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/home/);
}

const SCREENS = ['/home', '/pantry', '/recipes', '/settings'];

test.describe('accessibility', () => {
  test('serves a CSP header on a rendered document', async ({ request }) => {
    // `/` is a 307 redirect; assert on a real document response.
    const res = await request.get('/login');
    expect(res.headers()['content-security-policy']).toContain("default-src 'self'");
  });

  for (const path of SCREENS) {
    test(`no serious/critical axe violations on ${path}`, async ({ page }) => {
      await signIn(page);
      await page.goto(path);
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const blocking = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(blocking, JSON.stringify(blocking.map((v) => v.id), null, 2)).toEqual([]);
    });
  }
});
