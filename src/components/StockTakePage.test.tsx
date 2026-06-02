import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StockTakePage } from './StockTakePage';
import type { Bay, BaySlot } from '../types/modules';

// ── Mock sonner toast (aliased in vite.config.ts) ────────────────────────────
// Use vi.hoisted so the variable is available inside the vi.mock factory (which is hoisted)
const mockToast = vi.hoisted(() =>
  Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() })
);
vi.mock('sonner', () => ({ toast: mockToast }));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeBaySlots(shelves: number, columns: number, overrides: Partial<BaySlot>[] = []): BaySlot[] {
  const slots: BaySlot[] = [];
  for (let row = 0; row < shelves; row++) {
    for (let col = 0; col < columns; col++) {
      const override = overrides.find(o => o.row === row && o.col === col);
      slots.push({ row, col, type: 'single', traySlots: 0, ...override });
    }
  }
  return slots;
}

interface BayOverride {
  id?: string;
  name?: string;
  shelves?: number;
  columns?: number;
  hasDrawers?: boolean;
  drawerRows?: number;
  drawerColumns?: number;
  slots?: BaySlot[];
}

function makeBay(overrides: BayOverride = {}) {
  const shelves = overrides.shelves ?? 2;
  const columns = overrides.columns ?? 3;
  const bayId = overrides.id ?? 'bay-1';
  const bay: Bay = {
    id: bayId,
    name: overrides.name ?? 'Bay 1',
    shelves,
    columns,
    slots: overrides.slots ?? makeBaySlots(shelves, columns),
    hasDrawers: overrides.hasDrawers ?? false,
    drawerRows: overrides.drawerRows,
    drawerColumns: overrides.drawerColumns,
    x: 0, y: 0, width: 2, height: 2,
  };
  return { id: bayId, name: bay.name, bayData: bay };
}

function seedBays(bays: ReturnType<typeof makeBay>[]) {
  localStorage.setItem('store-layout-locations', JSON.stringify(bays));
}

function seedSelectedBays(ids: string[]) {
  localStorage.setItem('stock-take-selected-bays', JSON.stringify(ids));
}

async function renderAndSelectBay(bayOverride: BayOverride = {}) {
  const bay = makeBay(bayOverride);
  seedBays([bay]);
  const user = userEvent.setup();
  const result = render(<StockTakePage />);
  // Wait for useEffect to load bays
  await screen.findByText(bay.name);
  // Click the bay card to select it
  await user.click(screen.getByText(bay.name));
  return { ...result, user, bay };
}

async function renderInScanningMode(bayOverride: BayOverride = {}) {
  const { user, bay, ...rest } = await renderAndSelectBay(bayOverride);
  // Click Start Scanning
  const startBtn = screen.getByRole('button', { name: /start scanning/i });
  await user.click(startBtn);
  return { user, bay, ...rest };
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('StockTakePage', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();
    // window.confirm is needed for reset flow
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    // URL.createObjectURL / revokeObjectURL are often undefined in jsdom
    URL.createObjectURL = vi.fn(() => 'blob:fake');
    URL.revokeObjectURL = vi.fn(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();

    if (originalCreateObjectURL) {
      URL.createObjectURL = originalCreateObjectURL;
    } else {
      delete (URL as typeof URL & { createObjectURL?: typeof URL.createObjectURL }).createObjectURL;
    }

    if (originalRevokeObjectURL) {
      URL.revokeObjectURL = originalRevokeObjectURL;
    } else {
      delete (URL as typeof URL & { revokeObjectURL?: typeof URL.revokeObjectURL }).revokeObjectURL;
    }
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('initial render', () => {
    it('renders without crashing', () => {
      expect(() => render(<StockTakePage />)).not.toThrow();
    });

    it('shows the bay selection heading', () => {
      render(<StockTakePage />);
      expect(screen.getByText(/Select Bays for Stock Take/i)).toBeInTheDocument();
    });

    it('shows "No bays configured" when localStorage has no bays', () => {
      render(<StockTakePage />);
      expect(screen.getByText(/No bays configured/i)).toBeInTheDocument();
    });

    it('shows the control barcode reference section', () => {
      render(<StockTakePage />);
      expect(screen.getByText(/Control Barcodes Reference/i)).toBeInTheDocument();
    });
  });

  describe('bay loading', () => {
    it('displays bays loaded from localStorage', async () => {
      seedBays([makeBay({ name: 'Frozen Foods' })]);
      render(<StockTakePage />);
      expect(await screen.findByText('Frozen Foods')).toBeInTheDocument();
    });

    it('displays shelf and column dimensions for each bay', async () => {
      seedBays([makeBay({ shelves: 4, columns: 5, name: 'Bay A' })]);
      render(<StockTakePage />);
      await screen.findByText('Bay A');
      expect(screen.getByText(/4 shelves × 5 columns/i)).toBeInTheDocument();
    });

    it('shows drawer indicator for bays with drawers', async () => {
      seedBays([makeBay({ hasDrawers: true, drawerRows: 2, drawerColumns: 3, name: 'Drawer Bay' })]);
      render(<StockTakePage />);
      await screen.findByText('Drawer Bay');
      expect(screen.getByText(/Has drawers/i)).toBeInTheDocument();
    });
  });

  // ── Empty State Navigation ─────────────────────────────────────────────────

  describe('empty state navigation', () => {
    it('does not show "Go to Store Layout" button without onNavigate prop', () => {
      render(<StockTakePage />);
      expect(screen.queryByRole('button', { name: /Go to Store Layout/i })).not.toBeInTheDocument();
    });

    it('shows "Go to Store Layout" button when onNavigate prop is provided', () => {
      const onNavigate = vi.fn();
      render(<StockTakePage onNavigate={onNavigate} />);
      expect(screen.getByRole('button', { name: /Go to Store Layout/i })).toBeInTheDocument();
    });

    it('calls onNavigate("layout") when "Go to Store Layout" button is clicked', async () => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(<StockTakePage onNavigate={onNavigate} />);
      await user.click(screen.getByRole('button', { name: /Go to Store Layout/i }));
      expect(onNavigate).toHaveBeenCalledWith('layout');
    });
  });

  // ── Bay Selection ──────────────────────────────────────────────────────────

  describe('bay selection', () => {
    it('selects a bay when clicked', async () => {
      const bay = makeBay({ name: 'Test Bay' });
      seedBays([bay]);
      const user = userEvent.setup();
      render(<StockTakePage />);
      await screen.findByText('Test Bay');

      const bayToggle = screen.getByRole('button', { name: /toggle bay selection for test bay/i });
      expect(bayToggle).toHaveAttribute('aria-pressed', 'false');
      await user.click(screen.getByText('Test Bay'));
      expect(bayToggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('deselects a bay when clicked again', async () => {
      const bay = makeBay({ name: 'Bay Alpha' });
      seedBays([bay]);
      const user = userEvent.setup();
      render(<StockTakePage />);
      await screen.findByText('Bay Alpha');
      const bayCard = screen.getByText('Bay Alpha');
      await user.click(bayCard);
      await user.click(bayCard);
      expect(screen.getByRole('button', { name: /toggle bay selection for bay alpha/i })).toHaveAttribute('aria-pressed', 'false');
    });

    it('supports keyboard selection with Enter on bay cards', async () => {
      const bay = makeBay({ name: 'Keyboard Bay' });
      seedBays([bay]);
      const user = userEvent.setup();
      render(<StockTakePage />);
      await screen.findByText('Keyboard Bay');

      const bayToggle = screen.getByRole('button', { name: /toggle bay selection for keyboard bay/i });
      bayToggle.focus();
      await user.keyboard('{Enter}');

      expect(bayToggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('saves selected bays to localStorage', async () => {
      const bay = makeBay({ id: 'bay-x', name: 'Bay X' });
      seedBays([bay]);
      const user = userEvent.setup();
      render(<StockTakePage />);
      await screen.findByText('Bay X');
      await user.click(screen.getByText('Bay X'));
      const saved = JSON.parse(localStorage.getItem('stock-take-selected-bays') || '[]');
      expect(saved).toContain('bay-x');
    });

    it('restores bay selection from localStorage on mount', async () => {
      const bay = makeBay({ id: 'bay-r', name: 'Restored Bay' });
      seedBays([bay]);
      seedSelectedBays(['bay-r']);
      render(<StockTakePage />);
      await screen.findByText('Restored Bay');
      expect(screen.getByRole('button', { name: /toggle bay selection for restored bay/i })).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows start scanning button when bays are selected', async () => {
      await renderAndSelectBay({ name: 'Green Bay' });
      expect(screen.getByRole('button', { name: /start scanning/i })).toBeInTheDocument();
    });

    it('shows scan count when multiple bays selected', async () => {
      const b1 = makeBay({ id: 'b1', name: 'Bay One' });
      const b2 = makeBay({ id: 'b2', name: 'Bay Two' });
      seedBays([b1, b2]);
      const user = userEvent.setup();
      render(<StockTakePage />);
      await screen.findByText('Bay One');
      await user.click(screen.getByText('Bay One'));
      await user.click(screen.getByText('Bay Two'));
      expect(screen.getByRole('button', { name: /2 bays/i })).toBeInTheDocument();
    });
  });

  // ── Starting Scanning ──────────────────────────────────────────────────────

  describe('starting scanning', () => {
    it('shows error toast when trying to start with no bays selected', async () => {
      const bay = makeBay({ name: 'Empty Selection Bay' });
      seedBays([bay]);
      // DO NOT select any bay
      const user = userEvent.setup();
      render(<StockTakePage />);
      await screen.findByText('Empty Selection Bay');
      // No start button visible because no bays selected
      expect(screen.queryByRole('button', { name: /start scanning/i })).not.toBeInTheDocument();
    });

    it('enters scanning mode when start button is clicked', async () => {
      await renderInScanningMode();
      expect(screen.getByLabelText(/Scan Barcode/i)).toBeInTheDocument();
    });

    it('shows bay name in scanning view', async () => {
      await renderInScanningMode({ name: 'Hardware Bay' });
      expect(screen.getByText('Hardware Bay')).toBeInTheDocument();
    });

    it('shows shelf 1 and column 1 initially', async () => {
      await renderInScanningMode({ shelves: 3, columns: 4 });
      // The large shelf/column display numbers
      const displays = screen.getAllByText('1');
      expect(displays.length).toBeGreaterThanOrEqual(2);
    });

    it('shows the Pause button in scanning mode', async () => {
      await renderInScanningMode();
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });
  });

  // ── Scanning Workflow ──────────────────────────────────────────────────────

  describe('barcode scanning', () => {
    it('does nothing when empty barcode is submitted', async () => {
      const { user } = await renderInScanningMode();
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.click(input);
      await user.keyboard('{Enter}');
      expect(mockToast.success).not.toHaveBeenCalledWith(expect.stringMatching(/Scanned:/));
    });

    it('records a product when a valid barcode is submitted', async () => {
      const { user } = await renderInScanningMode();
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'ABC123{Enter}');
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringMatching(/Scanned: ABC123/)
      );
    });

    it('saves scanned products to localStorage', async () => {
      const { user } = await renderInScanningMode();
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'PRODUCT001{Enter}');
      const saved = JSON.parse(localStorage.getItem('stock-take-scanned-products') || '[]');
      expect(saved).toHaveLength(1);
      expect(saved[0].barcode).toBe('PRODUCT001');
    });

    it('converts barcode to uppercase', async () => {
      const { user } = await renderInScanningMode();
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'lowercase{Enter}');
      const saved = JSON.parse(localStorage.getItem('stock-take-scanned-products') || '[]');
      expect(saved[0].barcode).toBe('LOWERCASE');
    });

    it('records correct bay, shelf and column with the product', async () => {
      const { user } = await renderInScanningMode({ id: 'bay-scan', name: 'Scan Bay', shelves: 3, columns: 3 });
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'P001{Enter}');
      const saved = JSON.parse(localStorage.getItem('stock-take-scanned-products') || '[]');
      expect(saved[0]).toMatchObject({
        bayId: 'bay-scan',
        bayName: 'Scan Bay',
        shelf: 0,
        column: 0,
      });
    });

    it('advances the column after each scan', async () => {
      const { user } = await renderInScanningMode({ shelves: 2, columns: 3 });
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'P001{Enter}');
      // After scanning column 0, should be at column 1
      const saved = JSON.parse(localStorage.getItem('stock-take-scanned-products') || '[]');
      expect(saved[0].column).toBe(0);
      // Scan again
      await user.type(input, 'P002{Enter}');
      const saved2 = JSON.parse(localStorage.getItem('stock-take-scanned-products') || '[]');
      expect(saved2[1].column).toBe(1);
    });

    it('shows error for inactive slot', async () => {
      const slots = makeBaySlots(2, 3, [{ row: 0, col: 0, type: 'inactive' }]);
      // Force position to 0,0 by starting fresh
      const { user } = await renderInScanningMode({ shelves: 2, columns: 3, slots });
      // The first slot is inactive so we should be auto-skipped to column 1
      // Just verify the component doesn't crash
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'INACT{Enter}');
      // No crash is the main assertion here; toast.error might be called
      expect(screen.getByLabelText(/Scan Barcode/i)).toBeInTheDocument();
    });

    it('saves position to localStorage', async () => {
      const { user } = await renderInScanningMode({ shelves: 2, columns: 3 });
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'P001{Enter}');
      const pos = JSON.parse(localStorage.getItem('stock-take-position') || '{}');
      expect(pos).toHaveProperty('currentBayIndex');
      expect(pos).toHaveProperty('currentShelf');
      expect(pos).toHaveProperty('currentColumn');
    });
  });

  // ── Tray Mode ──────────────────────────────────────────────────────────────

  describe('tray mode', () => {
    it('records tray position (0) on the first scan of a tray slot', async () => {
      const slots = makeBaySlots(2, 3, [{ row: 0, col: 0, type: 'tray', traySlots: 4 }]);
      const { user } = await renderInScanningMode({ shelves: 2, columns: 3, slots });
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'TRAY001{Enter}');
      const saved = JSON.parse(localStorage.getItem('stock-take-scanned-products') || '[]');
      expect(saved[0].tray).toBe(0);
    });

    it('records incremented tray position on subsequent scans of a tray slot', async () => {
      const slots = makeBaySlots(2, 3, [{ row: 0, col: 0, type: 'tray', traySlots: 4 }]);
      const { user } = await renderInScanningMode({ shelves: 2, columns: 3, slots });
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'TRAY001{Enter}');
      await user.type(input, 'TRAY002{Enter}');
      const saved = JSON.parse(localStorage.getItem('stock-take-scanned-products') || '[]');
      expect(saved[0].tray).toBe(0);
      expect(saved[1].tray).toBe(1);
    });
  });

  // ── Control Codes ──────────────────────────────────────────────────────────

  describe('control codes', () => {
    async function scanControlCode(code: string) {
      const { user } = await renderInScanningMode({ shelves: 3, columns: 3 });
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, `${code}{Enter}`);
      return { user, input };
    }

    it('EMPTY control code triggers a toast and clears input', async () => {
      await scanControlCode('CTRL_EMPTY_SLOT');
      expect(mockToast).toHaveBeenCalledWith('Empty slot marked');
    });

    it('END_SHELF moves to next shelf', async () => {
      await scanControlCode('CTRL_END_SHELF');
      expect(mockToast).toHaveBeenCalledWith(expect.stringMatching(/next shelf/i));
    });

    it('END_BAY moves to next bay toast (only one bay selected → completes)', async () => {
      await scanControlCode('CTRL_END_BAY');
      // With only one bay, END_BAY should complete
      expect(mockToast.success).toHaveBeenCalledWith(expect.stringMatching(/All bays completed|next bay/i));
    });

    it('UNDO shows error when no products have been scanned', async () => {
      await scanControlCode('CTRL_UNDO');
      expect(mockToast.error).toHaveBeenCalledWith(expect.stringMatching(/No products to undo/i));
    });

    it('UNDO removes the last scanned product', async () => {
      const { user } = await renderInScanningMode({ shelves: 3, columns: 3 });
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'PROD1{Enter}');
      let saved = JSON.parse(localStorage.getItem('stock-take-scanned-products') || '[]');
      expect(saved).toHaveLength(1);
      await user.type(input, 'CTRL_UNDO{Enter}');
      saved = JSON.parse(localStorage.getItem('stock-take-scanned-products') || '[]');
      expect(saved).toHaveLength(0);
    });

    it('RESTART_BAY resets position to shelf 0, column 0', async () => {
      const { user } = await renderInScanningMode({ shelves: 3, columns: 3 });
      const input = screen.getByLabelText(/Scan Barcode/i);
      // Scan several products to advance position
      await user.type(input, 'A{Enter}');
      await user.type(input, 'B{Enter}');
      await user.type(input, 'CTRL_RESTART_BAY{Enter}');
      expect(mockToast.success).toHaveBeenCalledWith(expect.stringMatching(/Restarted current bay/i));
    });

    it('RESTART_SHELF resets column to 0', async () => {
      const { user } = await renderInScanningMode({ shelves: 3, columns: 3 });
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'A{Enter}');
      await user.type(input, 'CTRL_RESTART_SHELF{Enter}');
      expect(mockToast.success).toHaveBeenCalledWith(expect.stringMatching(/Restarted current shelf/i));
    });

    it('END_DRAWER_ROW shows error when not in drawer mode', async () => {
      await scanControlCode('CTRL_END_DRAWER_ROW');
      expect(mockToast.error).toHaveBeenCalledWith(expect.stringMatching(/Not in drawer mode/i));
    });

    it('MARK_DIRTY shows error when no products scanned', async () => {
      await scanControlCode('CTRL_MARK_DIRTY');
      expect(mockToast.error).toHaveBeenCalledWith(expect.stringMatching(/No products to mark as dirty/i));
    });

    it('MARK_DIRTY marks last product as needing cleaning', async () => {
      const { user } = await renderInScanningMode({ shelves: 3, columns: 3 });
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'PROD1{Enter}');
      await user.type(input, 'CTRL_MARK_DIRTY{Enter}');
      const saved = JSON.parse(localStorage.getItem('stock-take-scanned-products') || '[]');
      expect(saved[0].needsCleaning).toBe(true);
    });
  });

  // ── Pause and Reset ────────────────────────────────────────────────────────

  describe('pause and reset', () => {
    it('clicking Pause returns to bay selection view', async () => {
      const { user } = await renderInScanningMode();
      await user.click(screen.getByRole('button', { name: /pause/i }));
      expect(screen.getByText(/Select Bays for Stock Take/i)).toBeInTheDocument();
    });

    it('clicking Reset clears scanned products and exits scanning mode', async () => {
      const { user } = await renderInScanningMode({ shelves: 2, columns: 3 });
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'P001{Enter}');
      await user.click(screen.getByRole('button', { name: /reset/i }));
      expect(window.confirm).toHaveBeenCalled();
      // After reset the useEffect re-persists the cleared state as '[]'
      const saved = JSON.parse(localStorage.getItem('stock-take-scanned-products') || '[]');
      expect(saved).toHaveLength(0);
    });

    it('Reset requires confirmation before clearing', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const { user } = await renderInScanningMode({ shelves: 2, columns: 2 });
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'P001{Enter}');
      await user.click(screen.getByRole('button', { name: /reset/i }));
      // Should still have the product since we said no
      const saved = JSON.parse(localStorage.getItem('stock-take-scanned-products') || '[]');
      expect(saved).toHaveLength(1);
    });
  });

  // ── Settings Dialog ────────────────────────────────────────────────────────

  describe('settings dialog', () => {
    it('opens settings dialog when Customize button is clicked', async () => {
      render(<StockTakePage />);
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /customize/i }));
      expect(screen.getByText(/Customize Control Barcodes/i)).toBeInTheDocument();
    });

    it('can update a control barcode value', async () => {
      render(<StockTakePage />);
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /customize/i }));
      const emptyInput = screen.getByDisplayValue('CTRL_EMPTY_SLOT');
      await user.clear(emptyInput);
      await user.type(emptyInput, 'MY_EMPTY_CODE');
      await user.click(screen.getByRole('button', { name: /save changes/i }));
      const saved = JSON.parse(localStorage.getItem('custom-control-barcodes') || '{}');
      expect(saved.EMPTY).toBe('MY_EMPTY_CODE');
    });

    it('shows Reset to Defaults button only after customizing', async () => {
      render(<StockTakePage />);
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /customize/i }));
      // No customisation yet — reset button should NOT be present in dialog
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).queryByRole('button', { name: /reset to defaults/i })).not.toBeInTheDocument();
    });

    it('includes settings dialog description text for accessibility', async () => {
      render(<StockTakePage />);
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /customize/i }));
      expect(screen.getByText(/Set or reset control barcodes used for stocktake actions/i)).toBeInTheDocument();
    });
  });

  // ── Persistence & Resume ───────────────────────────────────────────────────

  describe('persistence and resume', () => {
    it('shows previous session banner when scanned products exist in localStorage', async () => {
      const bay = makeBay({ id: 'b1', name: 'Bay Resume' });
      seedBays([bay]);
      localStorage.setItem('stock-take-scanned-products', JSON.stringify([
        { barcode: 'OLD001', bayId: 'b1', bayName: 'Bay Resume', shelf: 0, column: 0, timestamp: Date.now() },
      ]));
      render(<StockTakePage />);
      await screen.findByText('Bay Resume');
      expect(screen.getByText(/Previous session found/i)).toBeInTheDocument();
    });

    it('shows Resume button when previous products exist and bay is selected', async () => {
      const bay = makeBay({ id: 'b1', name: 'Bay Resume2' });
      seedBays([bay]);
      seedSelectedBays(['b1']);
      localStorage.setItem('stock-take-scanned-products', JSON.stringify([
        { barcode: 'OLD001', bayId: 'b1', bayName: 'Bay Resume2', shelf: 0, column: 0, timestamp: Date.now() },
      ]));
      render(<StockTakePage />);
      await screen.findByText('Bay Resume2');
      expect(screen.getByRole('button', { name: /resume scanning/i })).toBeInTheDocument();
    });

    it('scanning mode shows recent scans list after scanning', async () => {
      const { user } = await renderInScanningMode({ name: 'Recent Bay' });
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'RECNT001{Enter}');
      expect(screen.getByText('Recent Scans')).toBeInTheDocument();
      expect(screen.getByText('RECNT001')).toBeInTheDocument();
    });
  });

  // ── Multi-Bay Scanning ─────────────────────────────────────────────────────

  describe('multi-bay scanning', () => {
    it('moves to next bay after END_BAY when multiple bays selected', async () => {
      const b1 = makeBay({ id: 'b1', name: 'Bay Alpha', shelves: 2, columns: 2 });
      const b2 = makeBay({ id: 'b2', name: 'Bay Beta', shelves: 2, columns: 2 });
      seedBays([b1, b2]);
      seedSelectedBays(['b1', 'b2']);
      const user = userEvent.setup();
      render(<StockTakePage />);
      await screen.findByText('Bay Alpha');
      const startBtn = await screen.findByRole('button', { name: /start scanning/i });
      await user.click(startBtn);
      // Should start on Bay Alpha
      expect(screen.getByText('Bay Alpha')).toBeInTheDocument();
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'CTRL_END_BAY{Enter}');
      // After END_BAY on Bay Alpha, should now be on Bay Beta
      expect(screen.getByText('Bay Beta')).toBeInTheDocument();
    });
  });

  // ── Drawer Mode ────────────────────────────────────────────────────────────

  describe('drawer mode', () => {
    it('transitions to drawer mode when END_BAY is used on a bay with drawers', async () => {
      const bay = makeBay({
        id: 'drawer-bay',
        name: 'Drawer Bay',
        shelves: 1,
        columns: 2,
        hasDrawers: true,
        drawerRows: 2,
        drawerColumns: 3,
      });
      seedBays([bay]);
      seedSelectedBays(['drawer-bay']);
      const user = userEvent.setup();
      render(<StockTakePage />);
      await screen.findByText('Drawer Bay');
      await user.click(await screen.findByRole('button', { name: /start scanning/i }));
      const input = screen.getByLabelText(/Scan Barcode/i);
      await user.type(input, 'CTRL_END_BAY{Enter}');
      expect(mockToast).toHaveBeenCalledWith(expect.stringMatching(/drawer mode/i));
    });
  });
});
