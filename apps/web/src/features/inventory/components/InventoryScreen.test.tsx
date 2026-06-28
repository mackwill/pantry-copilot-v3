import type { PantryItem } from '@pantry/contracts';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { inventoryStrings } from '../strings';
import { InventoryScreen } from './InventoryScreen';

const invalidate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useRouter: () => ({ invalidate }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

const create = vi.fn<(input: unknown) => Promise<unknown>>().mockResolvedValue({});
vi.mock('../../../lib/api', () => ({
  api: { pantry: { create: { mutate: (input: unknown): Promise<unknown> => create(input) } } },
}));

const item: PantryItem = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Whole milk',
  brand: null,
  quantity: 1,
  unit: 'gallon',
  category: 'dairy',
  location: 'fridge_top',
  purchasedAt: null,
  bestBy: null,
  notes: null,
  createdAt: '2026-06-13T00:00:00.000Z',
  updatedAt: '2026-06-13T00:00:00.000Z',
};

const user = { name: 'Mara', email: 'mara@home.kitchen' };

describe('InventoryScreen — scan affordance', () => {
  it('opens a "mobile only" modal when Scan is clicked and closes it', () => {
    render(<InventoryScreen items={[item]} user={user} />);
    expect(screen.queryByText(inventoryStrings.scanModal.body)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: inventoryStrings.actions.scan }));
    expect(screen.getByText(inventoryStrings.scanModal.body)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: inventoryStrings.scanModal.close }));
    expect(screen.queryByText(inventoryStrings.scanModal.body)).toBeNull();
  });

  it('imports pasted CSV rows via pantry.create and refreshes', async () => {
    render(<InventoryScreen items={[item]} user={user} />);
    fireEvent.click(screen.getByRole('button', { name: inventoryStrings.actions.import }));
    fireEvent.change(screen.getByPlaceholderText(inventoryStrings.importModal.placeholder), {
      target: { value: 'Eggs,12,ea,protein,fridge_door' },
    });
    expect(screen.getByText(inventoryStrings.importModal.parsed(1))).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: inventoryStrings.importModal.importBtn(1) }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Eggs', quantity: 12 }));
    await vi.waitFor(() => {
      expect(invalidate).toHaveBeenCalled();
    });
  });
});
