import styles from './SliderTrack.module.css';

export interface SliderTrackProps {
  value: number;
  onChange?: ((value: number) => void) | undefined;
  label: string;
  trackHeight: number;
  thumbSize: number;
  verticalPadding: number;
  thumbShadow: string;
}

/** Gradient track + thumb with an invisible range input on top (as the design board does). */
export function SliderTrack({
  value,
  onChange,
  label,
  trackHeight,
  thumbSize,
  verticalPadding,
  thumbShadow,
}: SliderTrackProps) {
  return (
    <div className={styles['wrap']} style={{ padding: `${String(verticalPadding)}px 0` }}>
      <div className={styles['track']} style={{ height: trackHeight }} />
      <div
        className={styles['thumb']}
        style={{
          left: `${String(value)}%`,
          width: thumbSize,
          height: thumbSize,
          boxShadow: thumbShadow,
        }}
      />
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        aria-label={label}
        className={styles['input']}
        onChange={(event) => onChange?.(Number(event.target.value))}
      />
    </div>
  );
}
