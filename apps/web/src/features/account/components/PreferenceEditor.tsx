import { Button, Input } from '@pantry/design-system/web';
import { useState } from 'react';
import { accountStrings } from '../strings';
import { tagLabel } from '../preferenceLabels';
import styles from '../account.module.css';

const s = accountStrings.diet;

export interface PreferenceEditorProps {
  heading: string;
  /** Standard quick-pick options for this group. */
  options: readonly string[];
  /** Currently selected tags (standard or custom). */
  value: string[];
  onChange: (next: string[]) => void;
  testId: string;
}

/** A toggle-chip multiselect with a free-text custom-tag adder. */
export function PreferenceEditor({ heading, options, value, onChange, testId }: PreferenceEditorProps) {
  const [custom, setCustom] = useState('');
  // Standard options first, then any custom tags the user has added.
  const chips = [...options, ...value.filter((tag) => !options.includes(tag))];

  const toggle = (tag: string): void => {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]);
  };

  const addCustom = (): void => {
    const tag = custom.trim().toLowerCase();
    if (tag.length === 0 || value.includes(tag)) {
      setCustom('');
      return;
    }
    onChange([...value, tag]);
    setCustom('');
  };

  return (
    <section className={styles['dietSection']} data-testid={testId}>
      <div className={styles['dietHeading']}>{heading}</div>
      <div className={styles['chipRow']}>
        {chips.map((tag) => {
          const active = value.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={active}
              className={[styles['chip'], active ? styles['chipActive'] : ''].filter(Boolean).join(' ')}
              onClick={() => {
                toggle(tag);
              }}
            >
              {tagLabel(tag)}
            </button>
          );
        })}
      </div>
      <div className={styles['customRow']}>
        <Input
          value={custom}
          onChange={setCustom}
          placeholder={s.addCustomPlaceholder}
        />
        <Button kind="secondary" size="sm" onClick={addCustom}>
          {s.add}
        </Button>
      </div>
    </section>
  );
}
