import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoreLayoutPage } from './StoreLayoutPage';

const mockToast = vi.hoisted(() =>
  Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() })
);
vi.mock('sonner', () => ({ toast: mockToast }));

describe('StoreLayoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders primary store mapping controls', () => {
    render(<StoreLayoutPage />);
    expect(screen.getByRole('button', { name: /add bay/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /obstruction/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /landmark/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('shows layout settings dialog description text', async () => {
    render(<StoreLayoutPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /settings/i }));
    expect(screen.getByText(/Adjust grid and physical layout dimensions for store mapping/i)).toBeInTheDocument();
  });

  it('supports keyboard toggling of bay slot buttons in configuration dialog', async () => {
    render(<StoreLayoutPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /add bay/i }));
    const canvas = screen.getByLabelText(/store layout canvas/i);
    fireEvent.click(canvas, { clientX: 20, clientY: 20 });

    const slotButton = await screen.findByRole('button', { name: /toggle slot shelf 1 column 1/i });
    expect(slotButton).toHaveAttribute('aria-pressed', 'false');

    slotButton.focus();
    await user.keyboard('{Enter}');

    expect(slotButton).toHaveAttribute('aria-pressed', 'true');
  });
});
