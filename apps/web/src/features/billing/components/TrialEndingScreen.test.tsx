import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { billingStrings as s } from '../strings';
import { TrialEndingScreen } from './TrialEndingScreen';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

const user = { name: 'Mara Singh', email: 'mara@home.kitchen' };

afterEach(() => {
  vi.clearAllMocks();
});

describe('TrialEndingScreen', () => {
  it('renders the trial-ending headline, badge and timeline', () => {
    render(
      <TrialEndingScreen user={user} onBack={vi.fn()} onKeepPro={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(screen.getByText(s.trialEnding.badge)).toBeTruthy();
    expect(screen.getByText(s.trialEnding.headlineLead)).toBeTruthy();
    expect(screen.getByText(s.trialEnding.timelineEyebrow)).toBeTruthy();
  });

  it('fires onKeepPro from the "Keep Pro" CTA', async () => {
    const onKeepPro = vi.fn();
    render(
      <TrialEndingScreen user={user} onBack={vi.fn()} onKeepPro={onKeepPro} onCancel={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Keep Pro/ }));
    expect(onKeepPro).toHaveBeenCalledTimes(1);
  });

  it('fires onCancel from the "Cancel trial" CTA', async () => {
    const onCancel = vi.fn();
    render(
      <TrialEndingScreen user={user} onBack={vi.fn()} onKeepPro={vi.fn()} onCancel={onCancel} />,
    );
    await userEvent.click(screen.getByRole('button', { name: s.trialEnding.cancelTrial }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
