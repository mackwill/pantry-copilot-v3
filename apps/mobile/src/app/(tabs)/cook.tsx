import { RecipeLibraryScreen } from '../../features/library/components/RecipeLibraryScreen';
import { useLibrary } from '../../features/library/useLibrary';

export default function Screen() {
  const { items } = useLibrary();
  return <RecipeLibraryScreen items={items} />;
}
