import { Button, Eyebrow, Icon } from '@pantry/design-system/web';
import { billingStrings as s } from '../strings';
import styles from '../billing.module.css';

interface LimitHitModalProps {
  /** Whether the modal is shown. */
  open: boolean;
  /** "Maybe later" / close / dismiss affordance. */
  onClose: () => void;
  /** Primary CTA — routes to the upgrade paywall. */
  onUpgrade: () => void;
}

/** Board paywall-contextual · frame 5 (`WebLimitHit`) — centered upgrade modal. */
export function LimitHitModal({ open, onClose, onUpgrade }: LimitHitModalProps) {
  if (!open) return null;
  const c = s.limitHit;

  return (
    <div className={styles['modalOverlay']} role="presentation" onClick={onClose}>
      <div
        className={styles['modal']}
        role="dialog"
        aria-modal="true"
        aria-label={c.ariaLabel}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className={styles['modalAccent']} />
        <div className={styles['modalBody']}>
          <div className={styles['modalHead']}>
            <div className={styles['modalHeadMeta']}>
              <span className={styles['modalIconBadge']}>
                <Icon name="Sparkles" size={18} color="var(--accent)" />
              </span>
              <div>
                <Eyebrow>{c.eyebrow}</Eyebrow>
                <div className={styles['modalQuota']}>{c.quota}</div>
              </div>
            </div>
            <button
              type="button"
              className={styles['modalClose']}
              aria-label={c.close}
              onClick={onClose}
            >
              <Icon name="X" size={18} color="var(--fg-subtle)" />
            </button>
          </div>

          <h2 className={styles['modalHeadline']}>
            {c.headlineLead}
            <br />
            <em className={styles['modalHeadlineEm']}>{c.headlineEmphasis}</em>
          </h2>
          <p className={styles['modalText']}>{c.body}</p>

          <div className={styles['modalPerks']}>
            {c.perks.map((perk) => {
              const italic = perk.value.includes(' ');
              const valueClass = [
                styles['modalPerkValue'],
                italic ? styles['modalPerkValueItalic'] : null,
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <div key={perk.label}>
                  <div className={valueClass}>{perk.value}</div>
                  <div className={styles['modalPerkLabel']}>{perk.label}</div>
                </div>
              );
            })}
          </div>

          <div className={styles['modalCtas']}>
            <div className={styles['modalCtaPrimary']}>
              <Button
                kind="primary"
                size="lg"
                full
                leftIcon={<Icon name="Sparkles" size={16} color="var(--accent-fg)" />}
                onClick={onUpgrade}
              >
                {c.startTrial}
              </Button>
            </div>
            <Button kind="secondary" size="lg" onClick={onUpgrade}>
              {c.seePlans}
            </Button>
            <Button kind="ghost" size="lg" onClick={onClose}>
              {c.waitTilSunday}
            </Button>
          </div>
          <div className={styles['modalFineprint']}>{c.fineprint}</div>
        </div>
      </div>
    </div>
  );
}
