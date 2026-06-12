import { Pill } from '@pantry/design-system/web';
import { authStrings } from '../strings';
import styles from './login.module.css';

const s = authStrings.hero;

const dimPill = { background: 'rgba(250, 250, 247, 0.08)', color: 'rgba(250, 250, 247, 0.85)' };
const greenPill = { background: 'rgba(164, 196, 107, 0.18)', color: '#C8DD92' };

export function LoginHero() {
  return (
    <div className={styles['hero']}>
      <div className={styles['heroGlow']} />
      <div className={styles['heroEyebrowRow']}>
        <span className={styles['heroDot']} />
        <span className={styles['heroEyebrowText']}>{s.eyebrow}</span>
      </div>
      <div className={styles['heroBody']}>
        <div className={styles['heroDisplay']}>
          {s.heading.before}
          <br />
          <em>{s.heading.em}</em>
        </div>
        <p className={styles['heroDesc']}>{s.description}</p>
        <div className={styles['heroPills']}>
          <Pill style={dimPill}>{s.pillTime}</Pill>
          <Pill style={dimPill}>{s.pillIngredients}</Pill>
          <Pill style={greenPill}>{s.pillExpiring}</Pill>
        </div>
      </div>
      <div className={styles['heroFooter']}>
        <div className={styles['weird']}>
          <span className={styles['weirdLabel']}>{s.weirdness}</span>
          <div className={styles['weirdTrack']}>
            <div className={styles['weirdKnob']} />
          </div>
        </div>
        <div className={styles['heroMeta']}>{s.meta}</div>
      </div>
    </div>
  );
}
