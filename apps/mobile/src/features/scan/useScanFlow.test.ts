import type { ImageScanResult, PantryItem } from '@pantry/contracts';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const extractMutate = vi.fn<(input: unknown) => Promise<unknown>>();
const confirmMutate = vi.fn<(input: unknown) => Promise<unknown>>();
const listQuery = vi.fn<() => Promise<unknown>>();

vi.mock('../../lib/api', () => ({
  api: {
    scan: {
      extract: { mutate: (input: unknown) => extractMutate(input) },
      confirm: { mutate: (input: unknown) => confirmMutate(input) },
    },
    pantry: { list: { query: () => listQuery() } },
  },
}));

import { useScanFlow } from './useScanFlow';

const SCAN_RESULT: ImageScanResult = {
  ingredients: [
    { name: 'Whole milk', normalizedName: 'whole milk', category: 'dairy', location: 'fridge_door', quantity: 0.5, unit: 'gallon', confidence: 0.94, notes: null },
    { name: 'Butter', normalizedName: 'butter', category: 'dairy', location: 'fridge_top', quantity: 1, unit: 'stick', confidence: 0.89, notes: null },
    { name: 'Unknown jar', normalizedName: 'unknown jar', category: null, location: null, quantity: 1, unit: 'jar', confidence: 0.42, notes: 'low confidence' },
  ],
  duplicatesMerged: [],
  reviewNotes: null,
};

const asset = { base64: 'aGVsbG8=', mediaType: 'image/jpeg' } as const;

beforeEach(() => {
  extractMutate.mockReset().mockResolvedValue({ scanId: 'scan-1', result: SCAN_RESULT });
  confirmMutate.mockReset().mockResolvedValue([{ id: 'p1' }, { id: 'p2' }] as PantryItem[]);
  listQuery.mockReset().mockResolvedValue([] as PantryItem[]);
});

describe('useScanFlow', () => {
  it('starts on the viewfinder with no rows', () => {
    const { result } = renderHook(() => useScanFlow());
    expect(result.current.step).toBe('viewfinder');
    expect(result.current.rows).toEqual([]);
  });

  it('captures → detecting → review, mapping rows with confidence-based default selection', async () => {
    const { result } = renderHook(() => useScanFlow());
    act(() => {
      result.current.capture(asset);
    });
    expect(result.current.step).toBe('detecting');

    await waitFor(() => {
      expect(result.current.step).toBe('review');
    });
    expect(extractMutate).toHaveBeenCalledWith({ imageBase64: asset.base64, mediaType: asset.mediaType });
    expect(result.current.rows).toHaveLength(3);
    const milk = result.current.rows.find((r) => r.name === 'Whole milk');
    const jar = result.current.rows.find((r) => r.name === 'Unknown jar');
    expect(milk?.selected).toBe(true);
    expect(jar?.selected).toBe(false);
    expect(result.current.selectedCount).toBe(2);
  });

  it('toggles a row selection', async () => {
    const { result } = renderHook(() => useScanFlow());
    act(() => {
      result.current.capture(asset);
    });
    await waitFor(() => {
      expect(result.current.step).toBe('review');
    });
    const jarId = result.current.rows.find((r) => r.name === 'Unknown jar')?.id ?? '';
    act(() => {
      result.current.toggle(jarId);
    });
    expect(result.current.selectedCount).toBe(3);
  });

  it('edits a row field', async () => {
    const { result } = renderHook(() => useScanFlow());
    act(() => {
      result.current.capture(asset);
    });
    await waitFor(() => {
      expect(result.current.step).toBe('review');
    });
    const milkId = result.current.rows.find((r) => r.name === 'Whole milk')?.id ?? '';
    act(() => {
      result.current.editRow(milkId, { name: 'Oat milk' });
    });
    expect(result.current.rows.find((r) => r.id === milkId)?.name).toBe('Oat milk');
  });

  it('adds a missing row that starts selected', async () => {
    const { result } = renderHook(() => useScanFlow());
    act(() => {
      result.current.capture(asset);
    });
    await waitFor(() => {
      expect(result.current.step).toBe('review');
    });
    act(() => {
      result.current.addMissing();
    });
    expect(result.current.rows).toHaveLength(4);
    expect(result.current.rows.at(-1)?.selected).toBe(true);
  });

  it('confirms only the selected rows and transitions to added', async () => {
    listQuery.mockResolvedValue([{ id: 'a' }, { id: 'b' }, { id: 'c' }] as PantryItem[]);
    const { result } = renderHook(() => useScanFlow());
    act(() => {
      result.current.capture(asset);
    });
    await waitFor(() => {
      expect(result.current.step).toBe('review');
    });
    act(() => {
      result.current.confirm();
    });
    await waitFor(() => {
      expect(result.current.step).toBe('added');
    });
    const payload = confirmMutate.mock.calls[0]?.[0] as { scanId: string; items: unknown[] };
    expect(payload.scanId).toBe('scan-1');
    expect(payload.items).toHaveLength(2);
    expect(result.current.summary?.added).toBe(2);
    expect(result.current.summary?.pantryTotal).toBe(3);
  });
});
