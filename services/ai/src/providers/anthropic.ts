import Anthropic from '@anthropic-ai/sdk';
import {
  type AIGenerationRequest,
  type AIImageExtractionRequest,
  type AIImageExtractionResponse,
  aiRecipeSchema,
  type GenerationEvent,
} from '@pantry/contracts';
import { RECIPE_EMIT_TOOL_DESCRIPTION, RECIPE_EMIT_TOOL_SCHEMA } from '../prompts/recipe-tool.js';
import { buildGenerationSystemPrompt } from '../prompts/recipes.js';
import { PANTRY_SCAN_TOOL_SCHEMA, SCAN_SYSTEM_PROMPT } from '../prompts/scans.js';
import { collectStructured } from './collect-structured.js';
import { buildExtractionResult, type RawToolOutput } from './scan-output.js';
import { type RawProviderEvent, runRecipeStream } from './stream-orchestrator.js';
import type { AIProvider, StructuredRecipeResult } from './types.js';

const MAX_SCAN_TOKENS = 2048;
const MAX_GEN_TOKENS = 4096;
const THINKING_BUDGET = 2048;

export interface AnthropicProviderOptions {
  apiKey: string | undefined;
  model: string;
}

/** Anthropic recipe provider: extended thinking + a single `emit_recipe` tool. */
export function createAnthropicProvider(opts: AnthropicProviderOptions): AIProvider {
  if (!opts.apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required to use the anthropic provider');
  }
  const client = new Anthropic({ apiKey: opts.apiKey });
  const { model } = opts;

  const runRaw =
    (req: AIGenerationRequest, signal: AbortSignal): AsyncIterable<RawProviderEvent> =>
      streamRaw(client, model, req, signal);

  return {
    name: 'anthropic',
    streamStructured: (req: AIGenerationRequest, signal: AbortSignal): AsyncIterable<GenerationEvent> =>
      runRecipeStream(req, runRaw, signal),
    generateStructured: (req: AIGenerationRequest): Promise<StructuredRecipeResult> => collectStructured(runRaw, req),
    async extractFromImage(req: AIImageExtractionRequest): Promise<AIImageExtractionResponse> {
      const hint = req.hint ? `\n\nUser hint: ${req.hint}` : '';
      const response = await client.messages.create({
        model,
        max_tokens: MAX_SCAN_TOKENS,
        system: SCAN_SYSTEM_PROMPT,
        tools: [{ name: 'emit_pantry_items', description: 'Emit the extracted pantry items as structured JSON.', input_schema: PANTRY_SCAN_TOOL_SCHEMA }],
        tool_choice: { type: 'tool', name: 'emit_pantry_items' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: req.mediaType, data: req.imageBase64 } },
              { type: 'text', text: `List every grocery item visible in this photo.${hint}` },
            ],
          },
        ],
      });
      const toolUse = response.content.find((block) => block.type === 'tool_use');
      if (!toolUse) {
        throw new Error('anthropic provider: model did not call emit_pantry_items');
      }
      return buildExtractionResult({
        provider: 'anthropic',
        model: response.model,
        output: toolUse.input as RawToolOutput,
        tokensUsed: { input: response.usage.input_tokens, output: response.usage.output_tokens },
      });
    },
  };
}

async function* streamRaw(
  client: Anthropic,
  model: string,
  req: AIGenerationRequest,
  signal: AbortSignal,
): AsyncIterable<RawProviderEvent> {
  const system = buildGenerationSystemPrompt(req.weirdness, req.pantry);
  const stream = client.messages.stream(
    {
      model,
      max_tokens: MAX_GEN_TOKENS,
      thinking: { type: 'enabled', budget_tokens: THINKING_BUDGET },
      system,
      tools: [{ name: 'emit_recipe', description: RECIPE_EMIT_TOOL_DESCRIPTION, input_schema: RECIPE_EMIT_TOOL_SCHEMA }],
      messages: [{ role: 'user', content: req.prompt }],
    },
    { signal },
  );

  let emitId: string | null = null;
  for await (const event of stream) {
    if (signal.aborted) return;
    if (event.type === 'content_block_start' && event.content_block.type === 'tool_use' && event.content_block.name === 'emit_recipe') {
      emitId = event.content_block.id;
      yield { type: 'emit_recipe_started', id: emitId };
    } else if (event.type === 'content_block_delta') {
      const delta = event.delta;
      if (delta.type === 'thinking_delta') {
        yield { type: 'thinking_delta', text: delta.thinking };
      } else if (delta.type === 'input_json_delta' && emitId) {
        yield { type: 'recipe_fragment', fragment: delta.partial_json };
      }
    }
  }

  const final = await stream.finalMessage();
  const toolUse = final.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && block.name === 'emit_recipe',
  );
  if (!toolUse) return;
  const recipe = aiRecipeSchema.parse(toolUse.input);
  yield { type: 'completed', recipe, tokensUsed: { input: final.usage.input_tokens, output: final.usage.output_tokens } };
}
