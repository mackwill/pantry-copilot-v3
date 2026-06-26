// M7 web frames: the recipe co-pilot. Frame 1 is the entry affordance on the
// recipe detail (chat chips, panel closed); frame 2 is the co-pilot panel open
// (?chat=true → live recipe doc + chat panel).
import { generateRecipe, launch, newPage, openFirstRecipe, seedPantry, SEED_PANTRY, shoot, signUp, WEB } from './capture-web-lib';

const browser = await launch();
const page = await newPage(browser);

await signUp(page);
await seedPantry(page, SEED_PANTRY);
await generateRecipe(page);
const recipeId = await openFirstRecipe(page);

// ── §✦ Entry on recipe (panel closed) ──
await page.getByText('Ask the copilot').waitFor();
await shoot(page, 'chat-against-a-recipe--web-1-entry-on-recipe');

// ── §✦ Chat panel open ──
await page.goto(`${WEB}/recipes/${recipeId}?chat=true`, { waitUntil: 'networkidle' });
await page.getByText('Recipe co-pilot').waitFor();
await shoot(page, 'chat-against-a-recipe--web-2-chat-panel-open');

await browser.close();
