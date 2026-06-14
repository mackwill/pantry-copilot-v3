import type { AIImageExtractionRequest, AIImageExtractionResponse } from '@pantry/contracts';
import OpenAI from 'openai';
import { PANTRY_SCAN_TOOL_SCHEMA, SCAN_SYSTEM_PROMPT } from '../prompts/scans.js';
import { buildExtractionResult, type RawToolOutput } from './scan-output.js';
import { type AIProvider, notImplementedUntilM4 } from './types.js';

export interface OpenAIProviderOptions {
  apiKey: string | undefined;
  model: string;
}

function parseArguments(json: string): RawToolOutput {
  const parsed: unknown = JSON.parse(json);
  return parsed && typeof parsed === 'object' ? parsed : {};
}

/** OpenAI vision provider: forced single-function structured extraction. */
export function createOpenAIProvider(opts: OpenAIProviderOptions): AIProvider {
  if (!opts.apiKey) {
    throw new Error('OPENAI_API_KEY is required to use the openai provider');
  }
  const client = new OpenAI({ apiKey: opts.apiKey });
  const { model } = opts;

  return {
    name: 'openai',
    generateStructured: () => notImplementedUntilM4('generateStructured'),
    streamStructured: () => notImplementedUntilM4('streamStructured'),
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
        tools: [
          {
            type: 'function',
            function: {
              name: 'emit_pantry_items',
              description: 'Emit the extracted pantry items as structured JSON.',
              parameters: PANTRY_SCAN_TOOL_SCHEMA,
            },
          },
        ],
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
        tokensUsed: {
          input: completion.usage?.prompt_tokens ?? 0,
          output: completion.usage?.completion_tokens ?? 0,
        },
      });
    },
  };
}
