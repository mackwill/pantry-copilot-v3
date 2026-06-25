/**
 * Per-request correlation id minted on the client so a single user action
 * threads web/mobile → api → ai under one id in the logs. The API honours an
 * inbound `x-request-id` (see services/api genReqId); this is the source.
 */
export function newRequestId(): string {
  return crypto.randomUUID();
}

export function requestIdHeaders(): { 'x-request-id': string } {
  return { 'x-request-id': newRequestId() };
}
