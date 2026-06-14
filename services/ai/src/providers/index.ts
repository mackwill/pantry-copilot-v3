import type { AIProviderName } from '@pantry/contracts';
import type { Env } from '../env.js';
import { createAnthropicProvider } from './anthropic.js';
import { mockProvider } from './mock.js';
import { createOpenAIProvider } from './openai.js';
import type { AIProvider } from './types.js';
import { withFallback } from './with-fallback.js';

/** Lazily instantiate one provider — only the selected providers need keys. */
function instantiate(name: AIProviderName, env: Env): AIProvider {
  switch (name) {
    case 'mock':
      return mockProvider;
    case 'anthropic':
      return createAnthropicProvider({ apiKey: env.ANTHROPIC_API_KEY, model: env.DEFAULT_AI_MODEL });
    case 'openai':
      return createOpenAIProvider({ apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL });
  }
}

/**
 * Compose the service's provider from env: the default provider, optionally
 * wrapped in the single `withFallback` chain when `AI_FALLBACK_PROVIDER` is set
 * to a different provider.
 */
export function buildProvider(env: Env, onFallbackError?: (provider: string, err: unknown) => void): AIProvider {
  const primary = instantiate(env.DEFAULT_AI_PROVIDER, env);
  if (env.AI_FALLBACK_PROVIDER && env.AI_FALLBACK_PROVIDER !== env.DEFAULT_AI_PROVIDER) {
    return withFallback(primary, instantiate(env.AI_FALLBACK_PROVIDER, env), onFallbackError);
  }
  return primary;
}
