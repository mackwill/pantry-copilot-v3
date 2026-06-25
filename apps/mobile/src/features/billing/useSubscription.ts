import type { SubscriptionState } from '@pantry/contracts';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

export interface UseSubscription {
  subscription: SubscriptionState | null;
  loading: boolean;
  error: boolean;
}

/** Loads the caller's server-authoritative entitlement state (settings + manage). */
export function useSubscription(): UseSubscription {
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    api.subscription.get
      .query()
      .then((state) => {
        if (active) {
          setSubscription(state);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return { subscription, loading, error };
}
