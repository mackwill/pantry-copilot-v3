import { describe, expect, it } from 'vitest';
import { topUpCreditConsumptions, topUpCreditGrants, revenuecatWebhookEvents, userSubscriptions } from './subscriptions.js';

describe('subscription schema', () => {
  it('exposes the four tables with their key columns', () => {
    expect(userSubscriptions.userId).toBeDefined();
    expect(userSubscriptions.tier).toBeDefined();
    expect(userSubscriptions.topUpCredits).toBeDefined();
    expect(revenuecatWebhookEvents.eventId).toBeDefined();
    expect(topUpCreditGrants.sourceEventId).toBeDefined();
    expect(topUpCreditConsumptions.actionKind).toBeDefined();
  });
});
