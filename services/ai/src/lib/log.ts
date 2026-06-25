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

export interface StreamCost {
  readonly label: string;
  readonly provider: string;
  readonly model: string;
  readonly tokensIn: number;
  readonly tokensOut: number;
  readonly events: number;
  readonly ms: number;
  readonly outcome: 'completed' | 'aborted' | 'errored';
}

/** Emit one structured cost line per generation/tweak stream. */
export function logStreamCost(log: FastifyBaseLogger, cost: StreamCost): void {
  log.info({ event: 'ai.stream.cost', ...cost }, 'ai stream complete');
}
