import type {
  CreatePantryItemInput,
  ExtractedIngredient,
  PantryCategory,
  PantryItem,
  PantryLocation,
  PantryUnit,
  ScanMediaType,
} from '@pantry/contracts';
import { freshnessFor } from '@pantry/utils';
import { useCallback, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { scanStrings } from './strings';

export type ScanStep = 'viewfinder' | 'detecting' | 'review' | 'added';

/** Rows below this confidence start unselected (the board's "low confidence" rule). */
const CONFIDENCE_THRESHOLD = 0.5;

export interface ReviewRow {
  id: string;
  name: string;
  quantity: number | null;
  unit: PantryUnit | null;
  category: PantryCategory | null;
  location: PantryLocation | null;
  confidence: number;
  notes: string | null;
  selected: boolean;
}

export type ReviewRowPatch = Partial<Pick<ReviewRow, 'name' | 'quantity' | 'unit' | 'category' | 'location'>>;

export interface ScanSummary {
  added: number;
  pantryTotal: number;
  attention: number;
}

export interface ScanAsset {
  base64: string;
  mediaType: ScanMediaType;
}

export interface UseScanFlow {
  step: ScanStep;
  rows: ReviewRow[];
  selectedCount: number;
  error: string | null;
  summary: ScanSummary | null;
  capture: (asset: ScanAsset) => void;
  toggle: (id: string) => void;
  editRow: (id: string, patch: ReviewRowPatch) => void;
  addMissing: () => void;
  confirm: () => void;
  reset: () => void;
}

function toCreateInput(row: ReviewRow): CreatePantryItemInput {
  return {
    name: row.name.trim() === '' ? scanStrings.review.untitledItem : row.name.trim(),
    brand: null,
    quantity: row.quantity ?? 1,
    unit: row.unit ?? 'ea',
    category: row.category ?? 'pantry',
    location: row.location ?? 'counter',
    purchasedAt: null,
    bestBy: null,
    notes: row.notes,
  };
}

function countAttention(items: PantryItem[]): number {
  return items.filter((item) => freshnessFor(item.bestBy).tone !== 'success').length;
}

export function useScanFlow(): UseScanFlow {
  const [step, setStep] = useState<ScanStep>('viewfinder');
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const scanId = useRef<string | null>(null);
  const nextId = useRef(0);

  const makeId = useCallback(() => {
    nextId.current += 1;
    return `row-${String(nextId.current)}`;
  }, []);

  const toRow = useCallback(
    (ingredient: ExtractedIngredient): ReviewRow => ({
      id: makeId(),
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      category: ingredient.category,
      location: ingredient.location,
      confidence: ingredient.confidence,
      notes: ingredient.notes,
      selected: ingredient.confidence >= CONFIDENCE_THRESHOLD,
    }),
    [makeId],
  );

  const capture = useCallback(
    (asset: ScanAsset) => {
      setStep('detecting');
      setError(null);
      api.scan.extract
        .mutate({ imageBase64: asset.base64, mediaType: asset.mediaType })
        .then((res) => {
          scanId.current = res.scanId;
          setRows(res.result.ingredients.map(toRow));
          setStep('review');
        })
        .catch(() => {
          setError(scanStrings.errors.extract);
          setStep('viewfinder');
        });
    },
    [toRow],
  );

  const toggle = useCallback((id: string) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, selected: !row.selected } : row)));
  }, []);

  const editRow = useCallback((id: string, patch: ReviewRowPatch) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  const addMissing = useCallback(() => {
    setRows((prev) => [
      ...prev,
      { id: makeId(), name: '', quantity: 1, unit: 'ea', category: 'pantry', location: 'counter', confidence: 1, notes: null, selected: true },
    ]);
  }, [makeId]);

  const confirm = useCallback(() => {
    const selected = rows.filter((row) => row.selected);
    if (selected.length === 0 || scanId.current === null) return;
    setError(null);
    api.scan.confirm
      .mutate({ scanId: scanId.current, items: selected.map(toCreateInput) })
      .then(async (created) => {
        const list = await api.pantry.list.query();
        setSummary({ added: created.length, pantryTotal: list.length, attention: countAttention(list) });
        setStep('added');
      })
      .catch(() => {
        setError(scanStrings.errors.confirm);
      });
  }, [rows]);

  const reset = useCallback(() => {
    setStep('viewfinder');
    setRows([]);
    setError(null);
    setSummary(null);
    scanId.current = null;
  }, []);

  return {
    step,
    rows,
    selectedCount: rows.filter((row) => row.selected).length,
    error,
    summary,
    capture,
    toggle,
    editRow,
    addMissing,
    confirm,
    reset,
  };
}
