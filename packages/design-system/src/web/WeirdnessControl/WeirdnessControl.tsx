import { weirdnessLabel } from '../../shared/weirdness.js';
import { Icon } from '../Icon/Icon.js';
import { SliderTrack } from '../WeirdnessSlider/SliderTrack.js';
import styles from './WeirdnessControl.module.css';

export interface WeirdnessControlProps {
  value: number;
  onChange?: ((value: number) => void) | undefined;
  size?: 'sm' | 'md';
}

/** One-line weirdness control — label · gradient track · current word. Lives in prompt footers. */
export function WeirdnessControl({ value, onChange, size = 'md' }: WeirdnessControlProps) {
  const sm = size === 'sm';
  const rootClass = [styles['control'], sm ? styles['sm'] : null].filter(Boolean).join(' ');
  return (
    <div className={rootClass}>
      <span className={styles['label']}>
        <Icon name="SlidersHorizontal" size={sm ? 12 : 13} color="var(--fg-muted)" />
        <span className={styles['labelText']}>Weirdness</span>
      </span>
      <div className={styles['trackArea']}>
        <SliderTrack
          value={value}
          onChange={onChange}
          label="Weirdness"
          trackHeight={6}
          thumbSize={sm ? 16 : 18}
          verticalPadding={7}
          thumbShadow="0 1px 4px rgba(14,18,14,0.25)"
        />
      </div>
      <span className={styles['current']}>{weirdnessLabel(value)}</span>
    </div>
  );
}
