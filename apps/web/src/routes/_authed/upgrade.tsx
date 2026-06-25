import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { PaywallCompare } from '../../features/billing/components/PaywallCompare';
import { PaywallEditorial } from '../../features/billing/components/PaywallEditorial';

const searchSchema = z.object({
  variant: z.enum(['editorial', 'compare']).optional(),
});

export const Route = createFileRoute('/_authed/upgrade')({
  ssr: false,
  validateSearch: (search) => searchSchema.parse(search),
  component: UpgradeRoute,
});

function UpgradeRoute() {
  const { variant } = Route.useSearch();
  const navigate = Route.useNavigate();

  const onPurchased = (): void => {
    void navigate({ to: '/home' });
  };
  const onDismiss = (): void => {
    void navigate({ to: '/home' });
  };

  if (variant === 'compare') {
    return <PaywallCompare onPurchased={onPurchased} onDismiss={onDismiss} />;
  }
  return (
    <PaywallEditorial
      onPurchased={onPurchased}
      onDismiss={onDismiss}
      onCompare={() => void navigate({ search: { variant: 'compare' } })}
    />
  );
}
