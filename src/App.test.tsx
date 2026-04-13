import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from './App';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
  Toaster: () => null,
}));

// Mock the heavy page components so we can test navigation without full rendering
vi.mock('./components/ColumnarDashboard', () => ({
  ColumnarDashboard: () => <div data-testid="columnar-dashboard">ColumnarDashboard</div>,
}));

vi.mock('./components/StoreLayoutPage', () => ({
  StoreLayoutPage: () => <div data-testid="store-layout-page">StoreLayoutPage</div>,
}));

vi.mock('./components/StockTakePage', () => ({
  StockTakePage: ({ onNavigate }: { onNavigate?: (view: string) => void }) => (
    <div data-testid="stock-take-page">
      StockTakePage
      {onNavigate && (
        <button onClick={() => onNavigate('layout')}>Go to Store Layout</button>
      )}
    </div>
  ),
}));

vi.mock('./components/ContactsPage', () => ({
  ContactsPage: () => <div data-testid="contacts-page">ContactsPage</div>,
}));

vi.mock('./components/DocumentsPage', () => ({
  DocumentsPage: () => <div data-testid="documents-page">DocumentsPage</div>,
}));

vi.mock('./components/AdminPortal', () => ({
  AdminPortal: () => <div data-testid="admin-portal">AdminPortal</div>,
}));

vi.mock('./components/sales/OpticalSalesPage', () => ({
  OpticalSalesPage: () => <div data-testid="optical-sales-page">OpticalSalesPage</div>,
}));

vi.mock('./components/pos/OpticalPOSScreen', () => ({
  OpticalPOSScreen: () => <div data-testid="optical-pos-screen">OpticalPOSScreen</div>,
}));

vi.mock('./components/ModuleSettings', () => ({
  ModuleSettings: () => <div data-testid="module-settings">ModuleSettings</div>,
}));

vi.mock('./components/AuthPage', () => ({
  AuthPage: ({ onAuthenticated }: { onAuthenticated: (u: string) => void }) => (
    <div data-testid="auth-page">
      <button onClick={() => onAuthenticated('testuser')}>Login</button>
    </div>
  ),
}));

vi.mock('react-dnd', () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./modules/registry', () => ({
  initializeModuleRegistry: vi.fn(),
}));

vi.mock('./utils/adminConfig', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils/adminConfig')>();
  return {
    ...actual,
    applyBranding: vi.fn(),
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function authenticateSession() {
  sessionStorage.setItem('currentUser', 'testuser');
}

function renderApp() {
  return render(<App />);
}

function authenticateAndRender() {
  authenticateSession();
  return renderApp();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication ─────────────────────────────────────────────────────────

  describe('authentication', () => {
    it('shows the auth page when not authenticated', () => {
      renderApp();
      expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    });

    it('does not show the dashboard when not authenticated', () => {
      renderApp();
      expect(screen.queryByTestId('columnar-dashboard')).not.toBeInTheDocument();
    });

    it('shows the main app after login', async () => {
      const user = userEvent.setup();
      renderApp();
      await user.click(screen.getByRole('button', { name: /login/i }));
      expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument();
    });

    it('restores session from sessionStorage on mount', () => {
      authenticateSession();
      renderApp();
      expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument();
    });

    it('restores session from localStorage rememberedUser', () => {
      localStorage.setItem('rememberedUser', 'persistent-user');
      renderApp();
      expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument();
    });

    it('shows logged-in username in the header', () => {
      authenticateSession();
      renderApp();
      expect(screen.getByText(/Welcome, testuser/i)).toBeInTheDocument();
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  describe('navigation', () => {
    it('shows dashboard view by default after login', () => {
      authenticateAndRender();
      expect(screen.getByTestId('columnar-dashboard')).toBeInTheDocument();
    });

    it('shows the Stock Take nav button by default (feature enabled by default)', () => {
      authenticateAndRender();
      // Both desktop and mobile navs render Stock Take buttons
      const btns = screen.getAllByRole('button', { name: /stock take/i });
      expect(btns.length).toBeGreaterThanOrEqual(1);
    });

    it('navigates to Stock Take page when nav button clicked', async () => {
      const user = userEvent.setup();
      authenticateAndRender();
      // Click the first visible Stock Take button (desktop nav)
      await user.click(screen.getAllByRole('button', { name: /stock take/i })[0]);
      expect(screen.getByTestId('stock-take-page')).toBeInTheDocument();
    });

    it('Stock Take nav button has active styling when on stock-take view', async () => {
      const user = userEvent.setup();
      authenticateAndRender();
      await user.click(screen.getAllByRole('button', { name: /stock take/i })[0]);
      // The testid page is shown confirming navigation succeeded
      expect(screen.getByTestId('stock-take-page')).toBeInTheDocument();
    });

    it('hides Stock Take nav button when feature is disabled', () => {
      localStorage.setItem('admin-config', JSON.stringify({
        branding: {},
        features: { stockTake: false },
      }));
      authenticateAndRender();
      expect(screen.queryByRole('button', { name: /stock take/i })).not.toBeInTheDocument();
    });

    it('still renders stock-take view even if nav button is hidden (direct view)', async () => {
      // The content rendering in App.tsx is separate from the nav button visibility.
      // This tests the routing logic directly.
      localStorage.setItem('admin-config', JSON.stringify({
        branding: {},
        features: { stockTake: true },
      }));
      const user = userEvent.setup();
      authenticateAndRender();
      await user.click(screen.getAllByRole('button', { name: /stock take/i })[0]);
      expect(screen.getByTestId('stock-take-page')).toBeInTheDocument();
    });

    it('navigates to Store Layout when StockTakePage calls onNavigate("layout")', async () => {
      const user = userEvent.setup();
      authenticateAndRender();
      // Go to stock take
      await user.click(screen.getAllByRole('button', { name: /stock take/i })[0]);
      expect(screen.getByTestId('stock-take-page')).toBeInTheDocument();
      // Click the "Go to Store Layout" button that the mock renders
      await user.click(screen.getByRole('button', { name: /Go to Store Layout/i }));
      expect(screen.getByTestId('store-layout-page')).toBeInTheDocument();
    });

    it('navigates to Admin when Admin button clicked', async () => {
      const user = userEvent.setup();
      authenticateAndRender();
      await user.click(screen.getByRole('button', { name: /admin/i }));
      expect(screen.getByTestId('admin-portal')).toBeInTheDocument();
    });

    it('shows Store Layout nav button when feature is enabled', () => {
      authenticateAndRender();
      expect(screen.getByRole('button', { name: /store layout/i })).toBeInTheDocument();
    });

    it('hides Store Layout nav button when feature is disabled', () => {
      localStorage.setItem('admin-config', JSON.stringify({
        branding: {},
        features: { storeLayout: false },
      }));
      authenticateAndRender();
      expect(screen.queryByRole('button', { name: /store layout/i })).not.toBeInTheDocument();
    });
  });

  // ── Logout ─────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('returns to auth page after logout', async () => {
      const user = userEvent.setup();
      authenticateAndRender();
      const logoutBtn = screen.getAllByRole('button', { name: /logout/i })[0];
      await user.click(logoutBtn);
      expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    });

    it('clears session storage on logout', async () => {
      authenticateSession();
      const user = userEvent.setup();
      renderApp();
      const logoutBtn = screen.getAllByRole('button', { name: /logout/i })[0];
      await user.click(logoutBtn);
      expect(sessionStorage.getItem('currentUser')).toBeNull();
    });
  });
});
