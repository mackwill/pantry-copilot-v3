import type { Env } from '../../env.js';

/**
 * Shape of a RevenueCat subscriber as returned by
 * GET /v1/subscribers/{app_user_id} (REST v1, the docs path used by
 * server-side integrations). We only model the fields we actually
 * upsert; everything else is preserved in `raw` for debugging.
 */
export interface RcSubscriberResponse {
  subscriber: {
    original_app_user_id?: string;
    entitlements?: Record<
      string,
      {
        expires_date: string | null;
        product_identifier: string;
        purchase_date: string;
        grace_period_expires_date?: string | null;
      }
    >;
    subscriptions?: Record<
      string,
      {
        expires_date: string | null;
        period_type?: string;
        store?: string;
        unsubscribe_detected_at?: string | null;
        billing_issues_detected_at?: string | null;
        grace_period_expires_date?: string | null;
        refunded_at?: string | null;
        auto_resume_date?: string | null;
        is_sandbox?: boolean;
      }
    >;
    non_subscriptions?: Record<
      string,
      Array<{ id: string; purchase_date: string; store?: string }>
    >;
  };
}

/**
 * Pull the latest subscriber state from RevenueCat's REST API.
 * Authenticated with the secret API key — never expose this to the
 * client. Returns null if RC is not configured (dev) or the call fails
 * after a single retry; callers must handle that gracefully.
 */
export async function fetchRevenueCatSubscriber(
  appUserId: string,
  env: Env,
): Promise<RcSubscriberResponse | null> {
  const apiKey = env.REVENUECAT_SECRET_API_KEY;
  if (!apiKey) return null;
  const base = env.REVENUECAT_API_BASE.replace(/\/$/, '');
  const url = `${base}/v1/subscribers/${encodeURIComponent(appUserId)}`;

  const doFetch = async (): Promise<RcSubscriberResponse> => {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`RevenueCat subscriber fetch failed: ${String(res.status)}`);
    }
    return (await res.json()) as RcSubscriberResponse;
  };

  try {
    return await doFetch();
  } catch {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      return await doFetch();
    } catch {
      return null;
    }
  }
}
