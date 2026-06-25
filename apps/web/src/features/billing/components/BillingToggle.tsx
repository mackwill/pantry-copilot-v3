import { billingStrings as s } from '../strings';
import styles from '../billing.module.css';

interface BillingToggleProps {
  annual: boolean;
  onChange: (annual: boolean) => void;
}

const options: ReadonlyArray<{ value: boolean; label: string }> = [
  { value: false, label: s.toggle.monthly },
  { value: true, label: s.toggle.annual },
];

export function BillingToggle({ annual, onChange }: BillingToggleProps) {
  return (
    <div className={styles['toggle']} role="group" aria-label={s.toggle.ariaLabel}>
      {options.map((option) => {
        const active = annual === option.value;
        const className = [styles['toggleOption'], active ? styles['toggleOptionActive'] : null]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={option.label}
            type="button"
            className={className}
            aria-pressed={active}
            onClick={() => {
              onChange(option.value);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
