import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon/Icon.js';
import styles from './BottomSheet.module.css';
import { useSheetFocus } from './useSheetFocus.js';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  eyebrow?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  /** Sheet height; defaults to content height capped at 78%. */
  height?: number | 'auto';
  /** Scrim opacity, per the design's `dim` prop. */
  dim?: number;
}

/** The one canonical sheet — pickers, asks, and consume flows all use it. */
export function BottomSheet({
  open,
  onClose,
  title,
  eyebrow,
  footer,
  children,
  height = 'auto',
  dim = 0.5,
}: BottomSheetProps) {
  const panelRef = useSheetFocus(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className={styles['container']}>
      <div
        data-testid="bottom-sheet-scrim"
        className={styles['scrim']}
        style={{ background: `rgba(14,18,14,${String(dim)})` }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        ref={panelRef}
        tabIndex={-1}
        className={styles['sheet']}
        style={height === 'auto' ? undefined : { height }}
      >
        <div className={styles['grabberRow']}>
          <div className={styles['grabber']} />
        </div>
        {(title !== undefined || eyebrow !== undefined) && (
          <div className={styles['header']}>
            <div className={styles['headerText']}>
              {eyebrow !== undefined && <div className={styles['eyebrow']}>{eyebrow}</div>}
              {title !== undefined && <div className={styles['title']}>{title}</div>}
            </div>
            <button type="button" aria-label="Close" className={styles['close']} onClick={onClose}>
              <Icon name="X" size={14} color="var(--fg-muted)" />
            </button>
          </div>
        )}
        <div className={styles['body']}>{children}</div>
        {footer !== undefined && <div className={styles['footer']}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
