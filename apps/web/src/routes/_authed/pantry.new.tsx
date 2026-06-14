import { createFileRoute } from '@tanstack/react-router';
import { IngredientFormScreen } from '../../features/ingredient-form/components/IngredientFormScreen';
import { api } from '../../lib/api';

export const Route = createFileRoute('/_authed/pantry/new')({
  ssr: false,
  loader: () => api.user.me.query(),
  component: NewIngredientRoute,
});

function NewIngredientRoute() {
  return <IngredientFormScreen user={Route.useLoaderData()} />;
}
