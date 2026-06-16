import { Eyebrow } from '@pantry/design-system/web';
import { cookStrings as s, formatTimer } from '../strings';
import styles from '../cook.module.css';

export interface CookTimerRingProps {
  secondsRemaining: number;
  durationSeconds: number;
  label: string;
}

const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Static-at-render countdown ring (board §03.5). Progress = remaining / duration. */
export function CookTimerRing({ secondsRemaining, durationSeconds, label }: CookTimerRingProps) {
  const pct = durationSeconds > 0 ? Math.max(0, Math.min(1, secondsRemaining / durationSeconds)) : 0;
  return (
    <div className={styles['timer']}>
      <div className={styles['timerRing']}>
        <svg width={88} height={88} viewBox="0 0 88 88" aria-hidden="true">
          <circle cx={44} cy={44} r={RADIUS} fill="none" stroke="var(--line)" strokeWidth={5} />
          <circle
            cx={44}
            cy={44}
            r={RADIUS}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={5}
            strokeDasharray={`${(CIRCUMFERENCE * pct).toString()} ${CIRCUMFERENCE.toString()}`}
            strokeLinecap="round"
            transform="rotate(-90 44 44)"
          />
        </svg>
        <div className={styles['timerValue']}>{formatTimer(secondsRemaining)}</div>
      </div>
      <div>
        <Eyebrow style={{ marginBottom: 6 }}>{label}</Eyebrow>
        <div className={styles['timerMeta']}>{s.timerOf(formatTimer(durationSeconds))}</div>
      </div>
    </div>
  );
}
