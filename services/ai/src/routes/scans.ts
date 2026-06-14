import { type AIImageExtractionResponse, aiImageExtractionRequestSchema } from '@pantry/contracts';
import type { FastifyInstance } from 'fastify';
import { logExtractionCost } from '../lib/log.js';
import { dedupeScanIngredients, normalizeScanIngredients } from '../pipelines/scan-normalize.js';
import type { AppDeps } from '../server.js';

export function registerScanRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.post('/scans/extract', async (req, reply) => {
    const parsed = aiImageExtractionRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: 'Invalid extraction request', issues: parsed.error.issues });
    }

    const startedAt = Date.now();
    try {
      const raw = await deps.provider.extractFromImage(parsed.data);
      const normalized = normalizeScanIngredients(raw.result.ingredients);
      const { ingredients, duplicatesMerged } = dedupeScanIngredients(normalized);
      const response: AIImageExtractionResponse = {
        provider: raw.provider,
        model: raw.model,
        tokensUsed: raw.tokensUsed,
        result: {
          ingredients,
          duplicatesMerged: [...raw.result.duplicatesMerged, ...duplicatesMerged],
          reviewNotes: raw.result.reviewNotes,
        },
      };
      logExtractionCost(req.log, {
        provider: response.provider,
        model: response.model,
        tokensIn: response.tokensUsed.input,
        tokensOut: response.tokensUsed.output,
        ms: Date.now() - startedAt,
      });
      return response;
    } catch (err) {
      // Resilience: a provider failure must never 500 the caller. Return a valid
      // empty result so the client can fall back to manual entry.
      req.log.error({ err }, 'scan extraction failed');
      const fallback: AIImageExtractionResponse = {
        provider: deps.provider.name,
        model: 'unavailable',
        tokensUsed: { input: 0, output: 0 },
        result: {
          ingredients: [],
          duplicatesMerged: [],
          reviewNotes: 'We could not read this image. Try again or add items manually.',
        },
      };
      return reply.code(200).send(fallback);
    }
  });
}
