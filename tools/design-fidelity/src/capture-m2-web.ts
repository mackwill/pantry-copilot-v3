// M2 web frames: inventory (full pantry), the ingredient form, and the account
// screen. Drives a fresh signup + the 12-item FULL_PANTRY fixture so the
// inventory counts match the board (12 items · 2 expiring · 1 past prime · 4
// locations). See capture-web-lib.ts for the shared helpers.
import { FULL_PANTRY, launch, newPage, seedPantry, shoot, signUp, WEB } from './capture-web-lib';

const browser = await launch();
const page = await newPage(browser);

await signUp(page);
await seedPantry(page, FULL_PANTRY);

// ── §05 Inventory (full pantry) ──
await page.goto(`${WEB}/pantry`, { waitUntil: 'networkidle' });
await page.getByText('Your pantry').waitFor();
await shoot(page, 'inventory-recipe-detail--web-inventory-full-pantry');

// ── §06 Ingredient form (new) ──
await page.goto(`${WEB}/pantry/new`, { waitUntil: 'networkidle' });
await page.getByText('New ingredient').waitFor();
await page.getByLabel('Name').waitFor();
await shoot(page, 'ingredient-form-account--web-ingredient-form');

// ── §09 Account / settings ──
await page.goto(`${WEB}/settings`, { waitUntil: 'networkidle' });
await page.getByText('Display name').waitFor();
await shoot(page, 'ingredient-form-account--web-user-account');

await browser.close();
