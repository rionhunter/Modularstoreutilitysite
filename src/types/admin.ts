export interface BrandingConfig {
  appName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  darkMode: boolean;
}

export interface FeatureFlags {
  // Core Modules
  cashCalculator: boolean;
  balanceCalculator: boolean;
  taskTracker: boolean;
  quickQuote: boolean;
  stockTracker: boolean;
  contacts: boolean;
  documents: boolean;
  specials: boolean;
  
  // Advanced Features
  storeLayout: boolean;
  stockTake: boolean;
  
  // Sales & POS
  sales: boolean;
  salesWorkflow: 'general' | 'optical' | 'automotive' | 'bookstore' | 'custom';
  
  // Custom Modules (for future expansion)
  customModules: string[];
}

export interface AdminConfig {
  branding: BrandingConfig;
  features: FeatureFlags;
  tradeType?: string;
  customFields?: Record<string, any>;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  appName: 'Store Utility',
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  accentColor: '#06b6d4',
  darkMode: false,
};

export const DEFAULT_FEATURES: FeatureFlags = {
  cashCalculator: true,
  balanceCalculator: true,
  taskTracker: true,
  quickQuote: true,
  stockTracker: true,
  contacts: true,
  documents: true,
  specials: true,
  storeLayout: true,
  stockTake: true,
  sales: true,
  salesWorkflow: 'general',
  customModules: [],
};