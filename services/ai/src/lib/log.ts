import type { FastifyBaseLogger } from 'fastify';

export interface ExtractionCost {
  readonly provider: string;
  readonly model: string;
  readonly tokensIn: number;
  readonly tokensOut: number;
  readonly ms: number;
}

/** Emit one structured cost line per extraction (request id comes from the log child). */
export function logExtractionCost(log: FastifyBaseLogger, cost: ExtractionCost): void {
  log.info({ event: 'ai.extract.cost', ...cost }, 'ai extraction complete');
}
