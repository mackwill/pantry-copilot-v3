import { Button, Eyebrow, Icon, WeirdnessControl } from '@pantry/design-system/web';
import type { ReactNode } from 'react';
import { generationStrings } from '../strings';
import styles from '../generation.module.css';

const s = generationStrings.home;

export interface HeroPromptProps {
  value: string;
  onChange: (value: string) => void;
  weirdness: number;
  onWeirdnessChange: (value: number) => void;
  onSubmit: () => void;
  /** Suggestion chips rendered in the footer (the SuggestionPills row). */
  chips?: ReactNode;
}

/**
 * The prompt-first hero — board §01. A 32px display textarea over a gradient
 * weirdness track + suggestion chips + the "Cook this" primary. Composed from
 * primitives (distinct from the smaller `NLPrompt`, per the M0 decision note).
 */
export function HeroPrompt({ value, onChange, weirdness, onWeirdnessChange, onSubmit, chips }: HeroPromptProps) {
  return (
    <div className={styles['hero']}>
      <div className={styles['heroTop']}>
        <div className={styles['heroEyebrowRow']}>
          <Icon name="Sparkles" size={16} color="var(--accent)" />
          <Eyebrow style={{ color: 'var(--accent)' }}>{s.eyebrow}</Eyebrow>
        </div>
        <textarea
          className={styles['heroTextarea']}
          value={value}
          placeholder={s.placeholder}
          rows={2}
          aria-label={s.eyebrow}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
        />
      </div>
      <div className={styles['heroFooter']}>
        <div className={styles['heroWeird']}>
          <WeirdnessControl value={weirdness} onChange={onWeirdnessChange} />
        </div>
        <div className={styles['heroChipsRow']}>
          <div className={styles['heroChips']}>{chips}</div>
          <Button kind="primary" rightIcon={<Icon name="ArrowRight" size={14} color="var(--accent-fg)" />} onClick={onSubmit}>
            {s.submit}
          </Button>
        </div>
      </div>
    </div>
  );
}
