import { BottomSheet, SheetRow, type IconName } from '@pantry/design-system/native';
import { libraryStrings } from '../strings';

export type RecipeSort = 'recent' | 'alpha' | 'quickest';

const s = libraryStrings.sort;

const OPTIONS: readonly { value: RecipeSort; label: string; icon: IconName }[] = [
  { value: 'recent', label: s.recent, icon: 'Clock' },
  { value: 'alpha', label: s.alpha, icon: 'ArrowDownUp' },
  { value: 'quickest', label: s.quickest, icon: 'Timer' },
];

export interface LibrarySortSheetProps {
  open: boolean;
  value: RecipeSort;
  onSelect: (value: RecipeSort) => void;
  onClose: () => void;
}

/** Sort order picker for the recipe library. */
export function LibrarySortSheet({ open, value, onSelect, onClose }: LibrarySortSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} eyebrow={s.eyebrow} title={s.title}>
      {OPTIONS.map((opt, i) => (
        <SheetRow
          key={opt.value}
          icon={opt.icon}
          label={opt.label}
          selected={value === opt.value}
          last={i === OPTIONS.length - 1}
          onPress={() => {
            onSelect(opt.value);
            onClose();
          }}
        />
      ))}
    </BottomSheet>
  );
}
