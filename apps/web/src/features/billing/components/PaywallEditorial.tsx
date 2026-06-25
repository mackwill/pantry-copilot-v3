import { Fragment } from 'react';
import { type PlanId, PLAN_CATALOG } from '@pantry/contracts';
import { Button, Eyebrow, Icon, Wordmark } from '@pantry/design-system/web';
import { useBilling } from '../useBilling';
import { billingStrings as s } from '../strings';
import styles from '../billing.module.css';
import { BillingToggle } from './BillingToggle';
import { PlanCard } from './PlanCard';

interface PaywallEditorialProps {
  /** Fired after a successful purchase + server sync. */
  onPurchased?: (planId: PlanId) => void;
  /** "Maybe later" / close affordance. */
  onDismiss?: () => void;
  /** "Compare all features" — routes to the ledger variant. */
  onCompare?: () => void;
}

export function PaywallEditorial({ onPurchased, onDismiss, onCompare }: PaywallEditorialProps) {
  const billing = useBilling(onPurchased ? { onPurchased } : {});
  const { annual } = billing;

  const choose = (planId: PlanId): void => {
    void billing.purchase(planId);
  };
  const dismiss = (): void => onDismiss?.();
  const compare = (): void => onCompare?.();

  return (
    <div className={styles['paywall']}>
      <div className={styles['paywallClose']}>
        <Button kind="ghost" size="sm" leftIcon={<Icon name="X" size={16} />} onClick={dismiss}>
          {s.paywall.maybeLater}
        </Button>
      </div>
      <div className={styles['paywallWordmark']}>
        <Wordmark size={22} />
      </div>

      <div className={styles['editorialGrid']}>
        <div>
          <Eyebrow style={{ marginBottom: 14 }}>{s.paywall.eyebrow}</Eyebrow>
          <h1 className={styles['editorialHeadline']}>
            {s.paywall.headlineLead}
            <br />
            <em className={styles['editorialHeadlineEm']}>{s.paywall.headlineEmphasis}</em>
          </h1>
          <p className={styles['editorialBody']}>{s.paywall.body}</p>

          <div className={styles['weirdGradient']} />

          <div className={styles['editorialToggle']}>
            <BillingToggle annual={annual} onChange={billing.setAnnual} />
          </div>

          <div className={styles['reassurance']}>
            <Icon name="Lock" size={14} color="var(--fg-subtle)" />
            {s.paywall.reassurance}
          </div>

          <div className={styles['statRow']}>
            {s.paywall.stats.map((stat) => {
              const italic = stat.value.includes(' ');
              const valueClass = [styles['statValue'], italic ? styles['statValueItalic'] : null]
                .filter(Boolean)
                .join(' ');
              return (
                <div key={stat.label}>
                  <div className={valueClass}>{stat.value}</div>
                  <div className={styles['statLabel']}>{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles['editorialAside']}>
          <div className={styles['foodSlot']}>
            <span className={styles['foodSlotLabel']}>{s.paywall.foodSlotHero}</span>
          </div>
          <div className={styles['editorialCards']}>
            <PlanCard plan={PLAN_CATALOG.basic} annual={annual} onChoose={choose} />
            <PlanCard plan={PLAN_CATALOG.pro} annual={annual} highlight onChoose={choose} />
          </div>
          <div className={styles['asideFooter']}>
            <span>
              {`${s.paywall.restorePrefix} `}
              <button
                type="button"
                className={styles['restoreCta']}
                onClick={() => void billing.restore()}
              >
                {s.paywall.restoreCta}
              </button>
            </span>
            <button type="button" className={styles['compareLink']} onClick={compare}>
              {s.paywall.compareCta}
            </button>
          </div>
        </div>
      </div>

      <div className={styles['proofRow']}>
        {s.paywall.proof.map((row, i) => (
          <Fragment key={row.stat}>
            <div className={styles['proofItem']}>
              <div className={styles['proofStat']}>{row.stat}</div>
              <div className={styles['proofSub']}>{row.sub}</div>
            </div>
            {i < s.paywall.proof.length - 1 ? <div className={styles['proofDivider']} /> : null}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
