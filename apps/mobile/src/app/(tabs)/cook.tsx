import { RecipeLibraryScreen } from '../../features/library/components/RecipeLibraryScreen';
import { useLibrary } from '../../features/library/useLibrary';

export default function Screen() {
  const { items, activeSession } = useLibrary();
  return <RecipeLibraryScreen items={items} activeSession={activeSession} />;
}
