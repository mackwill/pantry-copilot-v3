import { WEIRDNESS_LABELS, weirdnessLabel } from '../../shared/weirdness.js';
import { Eyebrow } from '../Eyebrow/Eyebrow.js';
import { SliderTrack } from './SliderTrack.js';
import styles from './WeirdnessSlider.module.css';

export interface WeirdnessSliderProps {
  value: number;
  onChange?: ((value: number) => void) | undefined;
  compact?: boolean;
}

export function WeirdnessSlider({ value, onChange, compact = false }: WeirdnessSliderProps) {
  const headerClass = [styles['header'], compact ? styles['headerCompact'] : null]
    .filter(Boolean)
    .join(' ');
  const currentClass = [styles['current'], compact ? styles['currentCompact'] : null]
    .filter(Boolean)
    .join(' ');
  return (
    <div>
      <div className={headerClass}>
        <Eyebrow>Weirdness</Eyebrow>
        <div className={currentClass}>{weirdnessLabel(value)}</div>
      </div>
      <SliderTrack
        value={value}
        onChange={onChange}
        label="Weirdness"
        trackHeight={8}
        thumbSize={24}
        verticalPadding={8}
        thumbShadow="0 2px 8px rgba(14,18,14,0.18)"
      />
      {!compact && (
        <div className={styles['vocabRow']}>
          {WEIRDNESS_LABELS.map((word) => (
            <span key={word} className={styles['vocabWord']}>
              {word}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
