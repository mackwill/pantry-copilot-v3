import type { AIGenerationRequest, AIImageExtractionResponse, ExtractedIngredient, GenerationEvent } from '@pantry/contracts';
import { MOCK_RECIPE, mockTape } from './mock-tape.js';
import { type RawProviderEvent, runRecipeStream } from './stream-orchestrator.js';
import type { AIProvider, StructuredRecipeResult } from './types.js';

const MODEL = 'mock-vision';

/**
 * Deterministic canned result mirroring the board §08 Review frame (6 kept
 * items + one low-confidence "Unknown jar" that starts unselected). Keeps CI
 * and the fidelity gate reproducible without any live model call.
 */
const CANNED_INGREDIENTS: ExtractedIngredient[] = [
  { name: 'Whole milk', normalizedName: 'whole milk', category: 'dairy', location: 'fridge_door', quantity: 0.5, unit: 'gallon', confidence: 0.94, notes: null },
  { name: 'Butter', normalizedName: 'butter', category: 'dairy', location: 'fridge_top', quantity: 1, unit: 'stick', confidence: 0.89, notes: null },
  { name: 'Carrots', normalizedName: 'carrots', category: 'produce', location: 'fridge_crisper', quantity: 3, unit: 'ea', confidence: 0.92, notes: null },
  { name: 'Scallions', normalizedName: 'scallions', category: 'produce', location: 'fridge_crisper', quantity: 1, unit: 'bunch', confidence: 0.81, notes: null },
  { name: 'Eggs', normalizedName: 'eggs', category: 'dairy', location: 'fridge_top', quantity: 6, unit: 'ea', confidence: 0.88, notes: null },
  { name: 'Apples', normalizedName: 'apples', category: 'produce', location: 'counter', quantity: 2, unit: 'ea', confidence: 0.76, notes: null },
  { name: 'Unknown jar', normalizedName: 'unknown jar', category: null, location: null, quantity: 1, unit: 'jar', confidence: 0.42, notes: 'Low-confidence guess — please confirm.' },
];

function cannedResponse(): AIImageExtractionResponse {
  return {
    provider: 'mock',
    model: MODEL,
    result: { ingredients: CANNED_INGREDIENTS.map((i) => ({ ...i })), duplicatesMerged: [], reviewNotes: null },
    tokensUsed: { input: 0, output: 0 },
  };
}

function tapeRunner(): (req: AIGenerationRequest, signal: AbortSignal) => AsyncIterable<RawProviderEvent> {
  return async function* () {
    await Promise.resolve();
    for (const event of mockTape()) yield event;
  };
}

export const mockProvider: AIProvider = {
  name: 'mock',
  generateStructured: (): Promise<StructuredRecipeResult> =>
    Promise.resolve({ recipe: MOCK_RECIPE, tokensUsed: { input: 0, output: 0 } }),
  streamStructured: (req: AIGenerationRequest, signal: AbortSignal): AsyncIterable<GenerationEvent> =>
    runRecipeStream(req, tapeRunner(), signal),
  extractFromImage: (): Promise<AIImageExtractionResponse> => Promise.resolve(cannedResponse()),
};
