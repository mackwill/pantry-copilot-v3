import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { GenerateScreen } from '../../features/generation/components/GenerateScreen';
import { api } from '../../lib/api';

const searchSchema = z.object({
  prompt: z.string().catch(''),
  weirdness: z.coerce.number().int().min(0).max(100).catch(40),
});

export const Route = createFileRoute('/_authed/cook/generate')({
  ssr: false,
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: ({ search }) => {
    if (search.prompt.trim().length === 0) throw redirect({ to: '/cook' });
  },
  loader: () => api.user.me.query(),
  component: GenerateRoute,
});

function GenerateRoute() {
  const user = Route.useLoaderData();
  const { prompt, weirdness } = Route.useSearch();
  return <GenerateScreen prompt={prompt} weirdness={weirdness} user={user} />;
}
