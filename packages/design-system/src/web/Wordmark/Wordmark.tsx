import styles from './Wordmark.module.css';

export interface WordmarkProps {
  size?: number;
  color?: string;
  accent?: string;
}

const BRAND = { pantry: 'Pantry', co: 'Co', pilot: 'Pilot' } as const;

export function Wordmark({
  size = 26,
  color = 'var(--fg)',
  accent = 'var(--accent)',
}: WordmarkProps) {
  return (
    <div className={styles['wordmark']} style={{ fontSize: size, color }}>
      {BRAND.pantry}
      <em className={styles['co']} style={{ color: accent }}>
        {BRAND.co}
      </em>
      {BRAND.pilot}
    </div>
  );
}
