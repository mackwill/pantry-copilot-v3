import type { ReactNode } from 'react';
import { Button } from '../Button/Button.js';
import { Eyebrow } from '../Eyebrow/Eyebrow.js';
import { Icon } from '../Icon/Icon.js';
import styles from './NLPrompt.module.css';

export interface NLPromptMic {
  label: string;
  onClick: () => void;
}

export interface NLPromptProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  /** Header label next to the sparkles icon, e.g. "Ask in your own words". */
  eyebrow?: ReactNode;
  /** Footer slot — where suggestion pills or the WeirdnessControl live. */
  footer?: ReactNode;
  submitLabel: ReactNode;
  onSubmit?: (() => void) | undefined;
  /** Renders the round voice-input button when provided. */
  mic?: NLPromptMic | undefined;
  rows?: number;
}

/** Natural-language prompt input — the headline way to ask for a recipe. */
export function NLPrompt({
  value,
  onChange,
  placeholder,
  eyebrow,
  footer,
  submitLabel,
  onSubmit,
  mic,
  rows = 2,
}: NLPromptProps) {
  return (
    <div className={styles['prompt']}>
      <div className={styles['top']}>
        {eyebrow !== undefined && (
          <div className={styles['eyebrowRow']}>
            <Icon name="Sparkles" size={16} color="var(--accent)" />
            <Eyebrow style={{ color: 'var(--accent)' }}>{eyebrow}</Eyebrow>
          </div>
        )}
        <textarea
          className={styles['textarea']}
          value={value}
          placeholder={placeholder}
          rows={rows}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      </div>
      <div className={styles['footerRow']}>
        <div className={styles['footerSlot']}>{footer}</div>
        {mic !== undefined && (
          <button type="button" aria-label={mic.label} className={styles['mic']} onClick={mic.onClick}>
            <Icon name="Mic" size={15} />
          </button>
        )}
        <Button
          kind="primary"
          rightIcon={<Icon name="ArrowRight" size={14} color="var(--accent-fg)" />}
          onClick={() => {
            onSubmit?.();
          }}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
