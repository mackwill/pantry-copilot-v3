import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-camera', () => ({
  useCameraPermissions: () => [{ granted: true }, () => undefined],
  CameraView: (props: { testID?: string; facing?: string; enableTorch?: boolean }) => (
    <div data-testid={props.testID} data-facing={props.facing} data-torch={props.enableTorch === true ? 'on' : 'off'} />
  ),
}));

import { ViewfinderStep } from './ViewfinderStep';

describe('ViewfinderStep camera controls', () => {
  it('flips the camera facing when the flip control is pressed', () => {
    render(<ViewfinderStep onCapture={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('scan-camera').getAttribute('data-facing')).toBe('back');
    fireEvent.click(screen.getByTestId('scan-flip'));
    expect(screen.getByTestId('scan-camera').getAttribute('data-facing')).toBe('front');
  });

  it('toggles the torch when the flash control is pressed', () => {
    render(<ViewfinderStep onCapture={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('scan-camera').getAttribute('data-torch')).toBe('off');
    fireEvent.click(screen.getByTestId('scan-flash'));
    expect(screen.getByTestId('scan-camera').getAttribute('data-torch')).toBe('on');
  });
});
