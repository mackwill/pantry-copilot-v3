import {
  type AIGenerationRequest,
  type AIImageExtractionRequest,
  type AIImageExtractionResponse,
  aiRecipeSchema,
  type GenerationEvent,
} from '@pantry/contracts';
import OpenAI from 'openai';
import { RECIPE_EMIT_TOOL_DESCRIPTION, RECIPE_EMIT_TOOL_SCHEMA } from '../prompts/recipe-tool.js';
import { buildGenerationSystemPrompt } from '../prompts/recipes.js';
import { PANTRY_SCAN_TOOL_SCHEMA, SCAN_SYSTEM_PROMPT } from '../prompts/scans.js';
import { collectStructured } from './collect-structured.js';
import { buildExtractionResult, type RawToolOutput } from './scan-output.js';
import { type RawProviderEvent, runRecipeStream } from './stream-orchestrator.js';
import type { AIProvider, StructuredRecipeResult } from './types.js';

export interface OpenAIProviderOptions {
  apiKey: string | undefined;
  model: string;
}

function parseArguments(json: string): RawToolOutput {
  const parsed: unknown = JSON.parse(json);
  return parsed && typeof parsed === 'object' ? parsed : {};
}

/** OpenAI recipe provider: streaming chat completion with a forced `emit_recipe` function. */
export function createOpenAIProvider(opts: OpenAIProviderOptions): AIProvider {
  if (!opts.apiKey) {
    throw new Error('OPENAI_API_KEY is required to use the openai provider');
  }
  const client = new OpenAI({ apiKey: opts.apiKey });
  const { model } = opts;

  const runRaw =
    (req: AIGenerationRequest, signal: AbortSignal): AsyncIterable<RawProviderEvent> => streamRaw(client, model, req, signal);

  return {
    name: 'openai',
    streamStructured: (req: AIGenerationRequest, signal: AbortSignal): AsyncIterable<GenerationEvent> =>
      runRecipeStream(req, runRaw, signal),
    generateStructured: (req: AIGenerationRequest): Promise<StructuredRecipeResult> => collectStructured(runRaw, req),
    async extractFromImage(req: AIImageExtractionRequest): Promise<AIImageExtractionResponse> {
      const hint = req.hint ? `\n\nUser hint: ${req.hint}` : '';
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: SCAN_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: `List every grocery item visible in this photo.${hint}` },
              { type: 'image_url', image_url: { url: `data:${req.mediaType};base64,${req.imageBase64}` } },
            ],
          },
        ],
        tools: [{ type: 'function', function: { name: 'emit_pantry_items', description: 'Emit the extracted pantry items as structured JSON.', parameters: PANTRY_SCAN_TOOL_SCHEMA } }],
        tool_choice: { type: 'function', function: { name: 'emit_pantry_items' } },
      });
      const call = completion.choices[0]?.message.tool_calls?.[0];
      if (!call || call.type !== 'function') {
        throw new Error('openai provider: model did not call emit_pantry_items');
      }
      return buildExtractionResult({
        provider: 'openai',
        model: completion.model,
        output: parseArguments(call.function.arguments),
        tokensUsed: { input: completion.usage?.prompt_tokens ?? 0, output: completion.usage?.completion_tokens ?? 0 },
      });
    },
  };
}

async function* streamRaw(
  client: OpenAI,
  model: string,
  req: AIGenerationRequest,
  signal: AbortSignal,
): AsyncIterable<RawProviderEvent> {
  const system = buildGenerationSystemPrompt(req.weirdness, req.pantry);
  const stream = await client.chat.completions.create(
    {
      model,
      stream: true,
      stream_options: { include_usage: true },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: req.prompt },
      ],
      tools: [{ type: 'function', function: { name: 'emit_recipe', description: RECIPE_EMIT_TOOL_DESCRIPTION, parameters: RECIPE_EMIT_TOOL_SCHEMA } }],
      tool_choice: { type: 'function', function: { name: 'emit_recipe' } },
    },
    { signal },
  );

  let started = false;
  let args = '';
  let usage = { input: 0, output: 0 };
  for await (const chunk of stream) {
    if (signal.aborted) return;
    if (chunk.usage) usage = { input: chunk.usage.prompt_tokens, output: chunk.usage.completion_tokens };
    const call = chunk.choices[0]?.delta.tool_calls?.[0];
    if (!call) continue;
    if (!started) {
      started = true;
      yield { type: 'emit_recipe_started', id: 'emit_recipe' };
    }
    const fragment = call.function?.arguments;
    if (fragment) {
      args += fragment;
      yield { type: 'recipe_fragment', fragment };
    }
  }

  if (!started) return;
  const recipe = aiRecipeSchema.parse(parseArguments(args));
  yield { type: 'completed', recipe, tokensUsed: usage };
}
