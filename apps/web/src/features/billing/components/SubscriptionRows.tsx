import type { SubscriptionState } from '@pantry/contracts';
import { Button, Card, Icon } from '@pantry/design-system/web';
import { billingStrings as s } from '../strings';
import styles from '../billing.module.css';

interface SubscriptionRowsProps {
  subscription: SubscriptionState;
  /** "Manage" / "Start free trial" — routes to the upgrade paywall. */
  onManage: () => void;
}

/** Formats an ISO expiry into a board-style long date, or the unknown dash. */
function formatExpiry(iso: string | null): string {
  if (iso === null) return s.subscription.unknown;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return s.subscription.unknown;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Board subscription · frame 10 (`WebSubscription`) — settings subscription card stack. */
export function SubscriptionRows({ subscription, onManage }: SubscriptionRowsProps) {
  const c = s.subscription;
  const isPro = subscription.isPro;
  const statusClass = [styles['subCard'], isPro ? styles['subCardPro'] : null]
    .filter(Boolean)
    .join(' ');
  const dateLabel = subscription.willRenew ? c.billingRows.renews : c.billingRows.expires;
  const expiry = formatExpiry(subscription.expiresAt);

  return (
    <div className={styles['subStack']}>
      <div className={statusClass}>
        {isPro ? <div className={styles['subCardAccent']} /> : null}
        <div className={styles['subEyebrow']}>
          <span className={styles['subEyebrowDot']} />
          {isPro ? c.proEyebrow : c.freeEyebrow}
        </div>
        <div className={styles['subTopRow']}>
          <div className={styles['subTitleCol']}>
            <div className={styles['subTitle']}>{isPro ? c.proTitle : c.freeTitle}</div>
            <div className={styles['subBlurb']}>{isPro ? c.proBlurb : c.freeBlurb}</div>
            {isPro ? null : <div className={styles['subMeta']}>{c.freeMeta}</div>}
          </div>
          {isPro ? (
            <Button
              kind="secondary"
              size="md"
              style={{
                background: 'transparent',
                border: '1px solid rgba(250, 250, 247, 0.25)',
                color: 'var(--fg-on-inverse)',
              }}
              onClick={onManage}
            >
              {c.proManage}
            </Button>
          ) : (
            <Button
              kind="primary"
              size="md"
              leftIcon={<Icon name="Sparkles" size={14} color="var(--accent-fg)" />}
              onClick={onManage}
            >
              {c.freeCta}
            </Button>
          )}
        </div>
      </div>

      {isPro ? (
        <>
          <Card>
            <h3 className={styles['subSectionTitle']}>{c.billingTitle}</h3>
            <div className={styles['subRow']}>
              <span className={styles['subRowKey']}>{c.billingRows.plan}</span>
              <span className={styles['subRowVal']}>{c.proTitle}</span>
            </div>
            <div className={styles['subRow']}>
              <span className={styles['subRowKey']}>{dateLabel}</span>
              <span className={styles['subRowVal']}>{expiry}</span>
            </div>
            <div className={styles['subRow']}>
              <span className={styles['subRowKey']}>{c.billingRows.billedVia}</span>
              <span className={styles['subRowVal']}>{subscription.store ?? c.unknown}</span>
            </div>
            <div className={styles['subRow']}>
              <span className={styles['subRowKey']}>{c.billingRows.topUp}</span>
              <span className={styles['subRowVal']}>{subscription.topUpCredits}</span>
            </div>
          </Card>

          <Card>
            <h3 className={styles['subSectionTitle']}>{c.changeTitle}</h3>
            <div className={styles['subActions']}>
              <Button
                kind="secondary"
                size="md"
                leftIcon={<Icon name="Sparkles" size={14} />}
                onClick={onManage}
              >
                {c.switchAnnual}
              </Button>
              <Button kind="secondary" size="md" onClick={onManage}>
                {c.downgrade}
              </Button>
              <Button
                kind="ghost"
                size="md"
                style={{ color: 'var(--danger)', marginLeft: 'auto' }}
                onClick={onManage}
              >
                {c.cancel}
              </Button>
            </div>
            <div className={styles['subFineprint']}>{c.fineprint}</div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
