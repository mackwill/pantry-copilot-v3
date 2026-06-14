import { createFileRoute, notFound } from '@tanstack/react-router';
import { IngredientFormScreen } from '../../features/ingredient-form/components/IngredientFormScreen';
import { api } from '../../lib/api';

export const Route = createFileRoute('/_authed/pantry/$itemId')({
  ssr: false,
  loader: async ({ params }) => {
    const [items, user] = await Promise.all([api.pantry.list.query(), api.user.me.query()]);
    const item = items.find((i) => i.id === params.itemId);
    if (item === undefined) throw notFound();
    return { item, user };
  },
  component: EditIngredientRoute,
});

function EditIngredientRoute() {
  const { item, user } = Route.useLoaderData();
  return <IngredientFormScreen item={item} user={user} />;
}
