// M6 web frame: the in-session "at the stove" screen (board §03.5, dark token
// theme). Mints a recipe, opens it, and taps "Start cooking" which calls
// cook.start and routes to /cook/session.
import { generateRecipe, launch, newPage, openFirstRecipe, seedPantry, SEED_PANTRY, shoot, signUp } from './capture-web-lib';

const browser = await launch();
const page = await newPage(browser);

await signUp(page);
await seedPantry(page, SEED_PANTRY);
await generateRecipe(page);
await openFirstRecipe(page);

// "Start cooking" → api.cook.start → navigate to /cook/session.
await page.getByRole('button', { name: /Start cooking/ }).click();
await page.waitForURL(/\/cook\/session/);
await page.getByText('Cooking now').waitFor();
await shoot(page, 'cook-tab-at-the-stove--web-cook-in-session');

await browser.close();
