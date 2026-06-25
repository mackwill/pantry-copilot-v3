import type { PlanDef, PlanId } from '@pantry/contracts';
import { Button, Icon } from '@pantry/design-system/web';
import { billingStrings as s } from '../strings';
import styles from '../billing.module.css';

interface PlanCardProps {
  plan: PlanDef;
  annual: boolean;
  highlight?: boolean;
  onChoose: (planId: PlanId) => void;
}

export function PlanCard({ plan, annual, highlight = false, onChoose }: PlanCardProps) {
  const price = annual ? plan.priceAnnual : plan.priceMonthly;
  const unit = annual ? s.planCard.perYear : s.planCard.perMonth;
  const cta = s.planCard.cta[plan.id];
  const blurb = s.planCard.blurb[plan.id];
  const cardClass = [styles['planCard'], highlight ? styles['planCardHighlight'] : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClass}>
      {highlight ? <div className={styles['planBadge']}>{s.planCard.popularBadge}</div> : null}
      <div className={styles['planHeader']}>
        <div className={styles['planName']}>{plan.name}</div>
        <div className={styles['planPriceWrap']}>
          <div className={styles['planPrice']}>
            {`$${String(price)}`}
            <span className={styles['planPriceUnit']}>{unit}</span>
          </div>
          {annual ? (
            <div className={styles['planSavings']}>
              {`${s.planCard.savePrefix} ${String(plan.annualSavingsPct)}%`}
            </div>
          ) : null}
        </div>
      </div>
      <div className={styles['planBlurb']}>{blurb}</div>
      <div className={styles['featureList']}>
        {plan.features.map((feature) => (
          <div key={feature} className={styles['featureRow']}>
            <span className={styles['featureCheck']}>
              <Icon
                name="Check"
                size={10}
                color={highlight ? 'var(--accent-strong)' : 'var(--accent)'}
              />
            </span>
            <span className={styles['featureText']}>{feature}</span>
          </div>
        ))}
      </div>
      <div className={styles['planCta']}>
        <Button
          kind={highlight ? 'primary' : 'secondary'}
          size="lg"
          full
          onClick={() => {
            onChoose(plan.id);
          }}
        >
          {cta}
        </Button>
      </div>
    </div>
  );
}
