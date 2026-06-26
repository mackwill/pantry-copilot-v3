// M5 web frames: the empty recipe library (board §03, "Cook" tab) and a
// populated recipe detail (board §05). The empty frame must be shot *before*
// any recipe exists, so we capture it first, then mint a recipe via the mock
// generate stream and open it.
import { generateRecipe, launch, newPage, openFirstRecipe, seedPantry, SEED_PANTRY, shoot, signUp, WEB } from './capture-web-lib';

const browser = await launch();
const page = await newPage(browser);

await signUp(page);
await seedPantry(page, SEED_PANTRY);

// ── §03 Cook library — empty (no recipes yet) ──
await page.goto(`${WEB}/recipes`, { waitUntil: 'networkidle' });
await page.getByText('Nothing on the stove').waitFor();
await shoot(page, 'cook-tab-library--web-cook-empty');

// ── §05 Recipe detail — mint one recipe, then open it ──
await generateRecipe(page);
await openFirstRecipe(page);
await page.locator('h1').first().waitFor();
await page.getByRole('button', { name: /Start cooking/ }).waitFor();
await shoot(page, 'inventory-recipe-detail--web-recipe-detail');

await browser.close();
