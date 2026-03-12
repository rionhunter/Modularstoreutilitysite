import { useState, useEffect, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ModuleSettings } from './components/ModuleSettings';
import { BentoDashboard } from './components/BentoDashboard';
import { ColumnarDashboard } from './components/ColumnarDashboard';
import { StoreLayoutPage } from './components/StoreLayoutPage';
import { StockTakePage } from './components/StockTakePage';
import { ContactsPage } from './components/ContactsPage';
import { DocumentsPage } from './components/DocumentsPage';
import { AuthPage } from './components/AuthPage';
import { AdminPortal } from './components/AdminPortal';
import { OpticalSalesPage } from './components/sales/OpticalSalesPage';
import { OpticalPOSScreen } from './components/pos/OpticalPOSScreen';
import { Module } from './types/modules';
import { Store, LayoutDashboard, LayoutGrid, Scan, Users, FileText, LogOut, Settings, ShoppingCart } from 'lucide-react';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { initializeModuleRegistry } from './modules/registry';
import { toast } from 'sonner@2.0.3';
import { getAdminConfig, applyBranding } from './utils/adminConfig';

const DEFAULT_MODULES: Module[] = [
  {
    id: 'cash-calculator',
    title: 'Cash Calculator',
    description: 'End of day banking with float accommodation',
    enabled: true,
    order: 0,
  },
  {
    id: 'transaction-calculator',
    title: 'Transaction Calculator',
    description: 'Track sales by payment categories',
    enabled: true,
    order: 1,
  },
  {
    id: 'task-tracker',
    title: 'Task Tracker',
    description: 'Task management with automated scheduling alerts',
    enabled: true,
    order: 2,
  },
  {
    id: 'quote-system',
    title: 'Quick Quote System',
    description: 'Generate customer quotes instantly',
    enabled: true,
    order: 3,
  },
  {
    id: 'stock-tracker',
    title: 'Stock Location Tracker',
    description: 'Track inventory across multiple locations',
    enabled: true,
    order: 4,
  },
  {
    id: 'balance-calculator',
    title: 'Balance Calculator',
    description: 'Track incoming and outgoing amounts to identify discrepancies',
    enabled: true,
    order: 5,
  },
  {
    id: 'calculator',
    title: 'Calculator',
    description: 'Quick calculations for daily operations',
    enabled: true,
    order: 6,
  },
  {
    id: 'specials',
    title: 'Specials Manager',
    description: 'Manage promotional specials with POS codes and automatic expiration',
    enabled: true,
    order: 7,
  },
];

type View = 'dashboard' | 'layout' | 'stock-take' | 'contacts' | 'documents' | 'admin' | 'sales';

// Initialize module registry on app load
initializeModuleRegistry();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>(() => {
    const saved = localStorage.getItem('store-modules');
    return saved ? JSON.parse(saved) : DEFAULT_MODULES;
  });
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [adminConfig, setAdminConfig] = useState(() => getAdminConfig());

  // Apply branding on mount and config changes
  useEffect(() => {
    applyBranding(adminConfig.branding);
    
    // Listen for config updates
    const handleConfigUpdate = ((e: CustomEvent) => {
      setAdminConfig(e.detail);
      applyBranding(e.detail.branding);
    }) as EventListener;
    
    window.addEventListener('admin-config-updated', handleConfigUpdate);
    return () => window.removeEventListener('admin-config-updated', handleConfigUpdate);
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const sessionUser = sessionStorage.getItem('currentUser');
    const rememberedUser = localStorage.getItem('rememberedUser');
    
    if (sessionUser) {
      setCurrentUser(sessionUser);
      setIsAuthenticated(true);
    } else if (rememberedUser) {
      setCurrentUser(rememberedUser);
      setIsAuthenticated(true);
      sessionStorage.setItem('currentUser', rememberedUser);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('store-modules', JSON.stringify(modules));
  }, [modules]);

  const handleModuleUpdate = (updatedModules: Module[]) => {
    setModules(updatedModules);
  };

  const handleAuthenticated = (username: string) => {
    setCurrentUser(username);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  if (!isAuthenticated) {
    return (
      <>
        <Toaster />
        <AuthPage onAuthenticated={handleAuthenticated} />
      </>
    );
  }

  const enabledModules = modules
    .filter(m => m.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h1 className="flex items-center gap-2">
                  Store Utility Dashboard
                </h1>
                <p className="text-xs text-muted-foreground">
                  Welcome, {currentUser}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('dashboard')}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              {adminConfig.features.storeLayout && (
                <Button
                  variant={currentView === 'layout' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('layout')}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Store Layout
                </Button>
              )}
              {adminConfig.features.stockTake && (
                <Button
                  variant={currentView === 'stock-take' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('stock-take')}
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Stock Take
                </Button>
              )}
              {adminConfig.features.sales && (
                <Button
                  variant={currentView === 'sales' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('sales')}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Sales
                </Button>
              )}
              {adminConfig.features.contacts && (
                <Button
                  variant={currentView === 'contacts' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('contacts')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Contacts
                </Button>
              )}
              {adminConfig.features.documents && (
                <Button
                  variant={currentView === 'documents' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('documents')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Documents
                </Button>
              )}
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={currentView === 'admin' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('admin')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="hidden md:flex"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t">
          <div className="flex gap-2 px-4 py-2 overflow-x-auto">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('dashboard')}
              className="flex-1 min-w-fit"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            {adminConfig.features.storeLayout && (
              <Button
                variant={currentView === 'layout' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('layout')}
                className="flex-1 min-w-fit"
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Layout
              </Button>
            )}
            {adminConfig.features.stockTake && (
              <Button
                variant={currentView === 'stock-take' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('stock-take')}
                className="flex-1 min-w-fit"
              >
                <Scan className="h-4 w-4 mr-2" />
                Stock Take
              </Button>
            )}
            {adminConfig.features.sales && (
              <Button
                variant={currentView === 'sales' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('sales')}
                className="flex-1 min-w-fit"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Sales
              </Button>
            )}
            {adminConfig.features.contacts && (
              <Button
                variant={currentView === 'contacts' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('contacts')}
                className="flex-1 min-w-fit"
              >
                <Users className="h-4 w-4 mr-2" />
                Contacts
              </Button>
            )}
            {adminConfig.features.documents && (
              <Button
                variant={currentView === 'documents' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('documents')}
                className="flex-1 min-w-fit"
              >
                <FileText className="h-4 w-4 mr-2" />
                Docs
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex-1 min-w-fit"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={currentView === 'dashboard' ? 'w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8' : 'container px-4 sm:px-6 lg:px-8 py-6 sm:py-8'}>
        {currentView === 'dashboard' ? (
          enabledModules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <LayoutDashboard className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl mb-2">No Modules Enabled</h2>
              <p className="text-muted-foreground mb-6">
                Enable modules in settings to customize your dashboard
              </p>
              <ModuleSettings modules={modules} onUpdate={handleModuleUpdate} />
            </div>
          ) : (
            <div className="max-w-[1800px] mx-auto">
              <DndProvider backend={HTML5Backend}>
                <ColumnarDashboard modules={modules} />
              </DndProvider>
            </div>
          )
        ) : currentView === 'admin' ? (
          <AdminPortal modules={modules} onModuleUpdate={handleModuleUpdate} />
        ) : currentView === 'sales' ? (
          <OpticalSalesPage />
        ) : currentView === 'layout' ? (
          <StoreLayoutPage />
        ) : currentView === 'stock-take' ? (
          <StockTakePage />
        ) : currentView === 'contacts' ? (
          <ContactsPage />
        ) : currentView === 'documents' ? (
          <DocumentsPage />
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Modular Store Utility System • Built for efficiency and scalability
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;