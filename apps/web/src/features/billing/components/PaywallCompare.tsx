import type { PlanId } from '@pantry/contracts';
import { Button, Eyebrow, Icon, Wordmark } from '@pantry/design-system/web';
import { useBilling } from '../useBilling';
import { billingStrings as s } from '../strings';
import styles from '../billing.module.css';
import { BillingToggle } from './BillingToggle';

type CellValue = string | boolean;

interface PaywallCompareProps {
  /** Fired after a successful purchase + server sync. */
  onPurchased?: (planId: PlanId) => void;
  /** Close / "Stay on Free" affordance. */
  onDismiss?: () => void;
}

const ITALIC_VALUES = new Set(['curious', 'adventurous', 'chaotic evil']);

function cx(...names: Array<string | undefined>): string {
  return names.filter(Boolean).join(' ');
}

function Cell({ value, pro }: { value: CellValue; pro: boolean }) {
  if (value === true) {
    return (
      <div className={styles['rowCheck']}>
        <Icon name="Check" size={14} color="var(--accent)" />
      </div>
    );
  }
  const className = [
    styles['rowCell'],
    value === '—' ? styles['rowCellMuted'] : pro ? styles['rowCellPro'] : null,
    typeof value === 'string' && ITALIC_VALUES.has(value) ? styles['rowCellItalic'] : null,
  ]
    .filter(Boolean)
    .join(' ');
  return <div className={className}>{value}</div>;
}

export function PaywallCompare({ onPurchased, onDismiss }: PaywallCompareProps) {
  const billing = useBilling(onPurchased ? { onPurchased } : {});
  const { annual } = billing;
  const c = s.compare;

  /** Column index 0 = Free (dismiss), 1 = Basic, 2 = Pro. */
  const ctaAction = (index: number): (() => void) => {
    if (index === 0) {
      return () => onDismiss?.();
    }
    const planId: PlanId = index === 1 ? 'basic' : 'pro';
    return () => void billing.purchase(planId);
  };
  const ctaKind = (index: number): 'ghost' | 'secondary' | 'primary' =>
    index === 0 ? 'ghost' : index === 1 ? 'secondary' : 'primary';

  return (
    <div className={styles['paywall']}>
      <div className={styles['paywallWordmark']}>
        <Wordmark size={22} />
      </div>
      <div className={styles['paywallClose']}>
        <Button
          kind="ghost"
          size="sm"
          leftIcon={<Icon name="X" size={16} />}
          onClick={ctaAction(0)}
        >
          {c.close}
        </Button>
      </div>

      <div className={styles['compareWrap']}>
        <div className={styles['compareHead']}>
          <div>
            <Eyebrow style={{ marginBottom: 10 }}>{c.eyebrow}</Eyebrow>
            <h1 className={styles['compareHeadline']}>
              {`${c.headlineLead} `}
              <em className={styles['compareHeadlineEm']}>{c.headlineEmphasis}</em>
            </h1>
          </div>
          <div className={styles['compareToggleCol']}>
            <BillingToggle annual={annual} onChange={billing.setAnnual} />
            <div className={styles['compareToggleNote']}>{c.priceNote}</div>
          </div>
        </div>

        <div className={cx(styles['compareGrid'], styles['compareHeaderRow'])}>
          <div>
            <div className={styles['compareLabelKicker']}>{c.compareLabel}</div>
            <div className={styles['compareLabelSub']}>{c.compareSub}</div>
          </div>
          {c.columns.map((col) => (
            <div key={col.name} className={styles['colHead']}>
              {col.best ? <div className={styles['colBadge']}>{c.bestValue}</div> : null}
              <div className={styles['colName']}>{col.name}</div>
              <div className={styles['colPrice']}>
                {`$${annual ? col.priceAnnual : col.priceMonthly}`}
                <span className={styles['colPriceUnit']}>{annual ? c.perYear : c.perMonth}</span>
              </div>
              {col.save && annual ? (
                <div className={styles['colSave']}>{`${c.savePrefix} ${col.save}`}</div>
              ) : null}
            </div>
          ))}
        </div>

        <div className={styles['compareRows']}>
          {c.rows.map((row) => (
            <div key={row.label} className={cx(styles['compareGrid'], styles['compareRow'])}>
              <div className={styles['rowLabel']}>{row.label}</div>
              <Cell value={row.free} pro={false} />
              <Cell value={row.basic} pro={false} />
              <Cell value={row.pro} pro />
            </div>
          ))}
        </div>

        <div className={cx(styles['compareGrid'], styles['compareCtas'])}>
          <div className={styles['compareTotalLabel']}>{c.totalLabel}</div>
          {c.columns.map((col, index) => (
            <Button
              key={col.name}
              kind={ctaKind(index)}
              size="md"
              full
              onClick={ctaAction(index)}
            >
              {col.cta}
            </Button>
          ))}
        </div>

        <div className={styles['receipt']}>
          <div>
            <div className={styles['receiptKicker']}>
              <div className={styles['receiptDot']} />
              <span className={styles['receiptKickerText']}>{c.receipt.eyebrow}</span>
            </div>
            <div className={styles['receiptHeadline']}>
              {`${c.receipt.headlineLead} `}
              <em className={styles['receiptHeadlineEm']}>{c.receipt.headlineEmphasis}</em>
            </div>
          </div>
          <div className={styles['receiptLedger']}>
            {c.receipt.ledgerTrial}
            <br />
            {annual ? c.receipt.ledgerChargeAnnual : c.receipt.ledgerChargeMonthly}
            <br />
            {c.receipt.ledgerReminder}
          </div>
        </div>
      </div>
    </div>
  );
}
