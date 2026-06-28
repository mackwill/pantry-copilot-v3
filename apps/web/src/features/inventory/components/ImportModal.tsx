import { Button } from '@pantry/design-system/web';
import { useMemo, useState } from 'react';
import { api } from '../../../lib/api';
import { parseImportCsv } from '../importCsv';
import { inventoryStrings } from '../strings';
import styles from '../inventory.module.css';

const m = inventoryStrings.importModal;

export interface ImportModalProps {
  onClose: () => void;
  /** Called after a successful import so the caller can refresh the list. */
  onImported: () => void;
}

/** Paste-a-CSV import for pantry items, reusing `pantry.create` per row. */
export function ImportModal({ onClose, onImported }: ImportModalProps) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const { rows, errors } = useMemo(() => parseImportCsv(text), [text]);

  const runImport = (): void => {
    if (rows.length === 0 || busy) return;
    setBusy(true);
    void Promise.all(rows.map((row) => api.pantry.create.mutate(row)))
      .then(() => {
        onImported();
      })
      .catch(() => {
        setBusy(false);
      });
  };

  return (
    <div className={styles['scanOverlay']} role="presentation" onClick={onClose}>
      <div
        className={styles['importCard']}
        role="dialog"
        aria-label={m.title}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <h3 className={styles['scanTitle']}>{m.title}</h3>
        <p className={styles['scanBody']}>{m.body}</p>
        <textarea
          className={styles['importTextarea']}
          value={text}
          placeholder={m.placeholder}
          rows={6}
          aria-label={m.placeholder}
          onChange={(event) => {
            setText(event.target.value);
          }}
        />
        <div className={styles['importStatus']}>
          <span>{m.parsed(rows.length)}</span>
          {errors.length > 0 && <span className={styles['importErrors']}>{m.errors(errors.length)}</span>}
        </div>
        <div className={styles['importActions']}>
          <Button kind="secondary" size="sm" onClick={onClose}>
            {m.cancel}
          </Button>
          <Button kind="primary" size="sm" onClick={runImport} disabled={rows.length === 0 || busy}>
            {busy ? m.importing : m.importBtn(rows.length)}
          </Button>
        </div>
      </div>
    </div>
  );
}
