import Anthropic from '@anthropic-ai/sdk';
import type { AIImageExtractionRequest, AIImageExtractionResponse } from '@pantry/contracts';
import { PANTRY_SCAN_TOOL_SCHEMA, SCAN_SYSTEM_PROMPT } from '../prompts/scans.js';
import { buildExtractionResult, type RawToolOutput } from './scan-output.js';
import { type AIProvider, notImplementedUntilM4 } from './types.js';

const MAX_OUTPUT_TOKENS = 2048;

export interface AnthropicProviderOptions {
  apiKey: string | undefined;
  model: string;
}

/** Anthropic vision provider: forced single-tool structured extraction. */
export function createAnthropicProvider(opts: AnthropicProviderOptions): AIProvider {
  if (!opts.apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required to use the anthropic provider');
  }
  const client = new Anthropic({ apiKey: opts.apiKey });
  const { model } = opts;

  return {
    name: 'anthropic',
    generateStructured: () => notImplementedUntilM4('generateStructured'),
    streamStructured: () => notImplementedUntilM4('streamStructured'),
    async extractFromImage(req: AIImageExtractionRequest): Promise<AIImageExtractionResponse> {
      const hint = req.hint ? `\n\nUser hint: ${req.hint}` : '';
      const response = await client.messages.create({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: SCAN_SYSTEM_PROMPT,
        tools: [
          {
            name: 'emit_pantry_items',
            description: 'Emit the extracted pantry items as structured JSON.',
            input_schema: PANTRY_SCAN_TOOL_SCHEMA,
          },
        ],
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
