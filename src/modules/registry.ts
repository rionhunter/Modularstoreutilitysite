import { ModuleRegistry, ModuleDefinition } from '../types/module-system';
import {
  Calculator,
  CreditCard,
  ListTodo,
  FileText,
  Package,
  Scale,
  Wallet,
  Tag,
} from 'lucide-react';

// Import module components
import { CashCalculatorModule } from '../components/modules/CashCalculatorModule';
import { TransactionCalculatorModule } from '../components/modules/TransactionCalculatorModule';
import { TaskTrackerModule } from '../components/modules/TaskTrackerModule';
import { QuoteSystemModule } from '../components/modules/QuoteSystemModule';
import { StockTrackerModule } from '../components/modules/StockTrackerModule';
import { BalanceCalculatorModule } from '../components/modules/BalanceCalculatorModule';
import { CalculatorModule } from '../components/modules/CalculatorModule';
import { SpecialsModule } from '../components/modules/SpecialsModule';

/**
 * Core Module Definitions
 * These are the built-in modules that come with the system
 */

export const CORE_MODULES: ModuleDefinition[] = [
  {
    metadata: {
      id: 'cash-calculator',
      version: '1.0.0',
      title: 'Cash Calculator',
      description: 'End of day banking with float accommodation',
      author: 'System',
      category: 'finance',
      icon: Wallet,
      tags: ['finance', 'cash', 'banking', 'eod'],
      configSchema: {
        fields: [
          {
            key: 'currency',
            label: 'Currency',
            type: 'select',
            defaultValue: 'USD',
            options: [
              { label: 'USD ($)', value: 'USD' },
              { label: 'EUR (€)', value: 'EUR' },
              { label: 'GBP (£)', value: 'GBP' },
              { label: 'AUD ($)', value: 'AUD' },
            ],
            description: 'Select your preferred currency',
          },
          {
            key: 'defaultFloat',
            label: 'Default Float Amount',
            type: 'number',
            defaultValue: 0,
            min: 0,
            description: 'Default float amount for cash register',
          },
        ],
      },
      defaultConfig: {
        currency: 'USD',
        defaultFloat: 0,
      },
    },
    component: CashCalculatorModule,
  },
  {
    metadata: {
      id: 'transaction-calculator',
      version: '1.0.0',
      title: 'Transaction Calculator',
      description: 'Track sales by payment categories with smart parsing',
      author: 'System',
      category: 'finance',
      icon: CreditCard,
      tags: ['finance', 'transactions', 'categories', 'sales'],
      configSchema: {
        fields: [
          {
            key: 'defaultCategory',
            label: 'Default Category Name',
            type: 'text',
            defaultValue: 'general',
            description: 'Default category for number-only entries',
          },
          {
            key: 'currency',
            label: 'Currency',
            type: 'select',
            defaultValue: 'USD',
            options: [
              { label: 'USD ($)', value: 'USD' },
              { label: 'EUR (€)', value: 'EUR' },
              { label: 'GBP (£)', value: 'GBP' },
              { label: 'AUD ($)', value: 'AUD' },
            ],
          },
        ],
      },
      defaultConfig: {
        defaultCategory: 'general',
        currency: 'USD',
      },
    },
    component: TransactionCalculatorModule,
  },
  {
    metadata: {
      id: 'task-tracker',
      version: '1.0.0',
      title: 'Task Tracker',
      description: 'Task management with automated scheduling alerts',
      author: 'System',
      category: 'productivity',
      icon: ListTodo,
      tags: ['tasks', 'productivity', 'alerts', 'scheduling'],
      configSchema: {
        fields: [
          {
            key: 'defaultAlertDays',
            label: 'Default Alert Days',
            type: 'number',
            defaultValue: 7,
            min: 1,
            max: 365,
            description: 'Default number of days before due date to alert',
          },
          {
            key: 'showCompleted',
            label: 'Show Completed Tasks',
            type: 'boolean',
            defaultValue: true,
            description: 'Display completed tasks in the list',
          },
        ],
      },
      defaultConfig: {
        defaultAlertDays: 7,
        showCompleted: true,
      },
    },
    component: TaskTrackerModule,
  },
  {
    metadata: {
      id: 'quote-system',
      version: '1.0.0',
      title: 'Quick Quote System',
      description: 'Generate customer quotes instantly',
      author: 'System',
      category: 'utility',
      icon: FileText,
      tags: ['quotes', 'customers', 'sales', 'estimates'],
      configSchema: {
        fields: [
          {
            key: 'currency',
            label: 'Currency',
            type: 'select',
            defaultValue: 'USD',
            options: [
              { label: 'USD ($)', value: 'USD' },
              { label: 'EUR (€)', value: 'EUR' },
              { label: 'GBP (£)', value: 'GBP' },
              { label: 'AUD ($)', value: 'AUD' },
            ],
          },
          {
            key: 'defaultExpiryDays',
            label: 'Default Quote Expiry (days)',
            type: 'number',
            defaultValue: 30,
            min: 1,
            description: 'Number of days until quote expires',
          },
          {
            key: 'taxRate',
            label: 'Tax Rate (%)',
            type: 'number',
            defaultValue: 0,
            min: 0,
            max: 100,
            description: 'Tax rate to apply to quotes',
          },
        ],
      },
      defaultConfig: {
        currency: 'USD',
        defaultExpiryDays: 30,
        taxRate: 0,
      },
    },
    component: QuoteSystemModule,
  },
  {
    metadata: {
      id: 'stock-tracker',
      version: '1.0.0',
      title: 'Stock Location Tracker',
      description: 'Track inventory across multiple locations',
      author: 'System',
      category: 'inventory',
      icon: Package,
      tags: ['inventory', 'stock', 'locations', 'warehouse'],
      configSchema: {
        fields: [
          {
            key: 'lowStockThreshold',
            label: 'Low Stock Threshold',
            type: 'number',
            defaultValue: 10,
            min: 0,
            description: 'Alert when stock falls below this number',
          },
          {
            key: 'showLowStockOnly',
            label: 'Show Low Stock Only',
            type: 'boolean',
            defaultValue: false,
            description: 'Only display items below threshold',
          },
        ],
      },
      defaultConfig: {
        lowStockThreshold: 10,
        showLowStockOnly: false,
      },
    },
    component: StockTrackerModule,
  },
  {
    metadata: {
      id: 'balance-calculator',
      version: '1.0.0',
      title: 'Balance Calculator',
      description: 'Track incoming and outgoing amounts to identify discrepancies',
      author: 'System',
      category: 'finance',
      icon: Scale,
      tags: ['finance', 'balance', 'reconciliation', 'discrepancy'],
      configSchema: {
        fields: [
          {
            key: 'currency',
            label: 'Currency',
            type: 'select',
            defaultValue: 'USD',
            options: [
              { label: 'USD ($)', value: 'USD' },
              { label: 'EUR (€)', value: 'EUR' },
              { label: 'GBP (£)', value: 'GBP' },
              { label: 'AUD ($)', value: 'AUD' },
            ],
          },
          {
            key: 'showDiscrepancyAlert',
            label: 'Show Discrepancy Alert',
            type: 'boolean',
            defaultValue: true,
            description: 'Highlight when incoming and outgoing do not match',
          },
        ],
      },
      defaultConfig: {
        currency: 'USD',
        showDiscrepancyAlert: true,
      },
    },
    component: BalanceCalculatorModule,
  },
  {
    metadata: {
      id: 'calculator',
      version: '1.0.0',
      title: 'Calculator',
      description: 'Quick calculations for daily operations',
      author: 'System',
      category: 'utility',
      icon: Calculator,
      tags: ['calculator', 'math', 'utility', 'operations'],
      configSchema: {
        fields: [
          {
            key: 'decimalPlaces',
            label: 'Decimal Places',
            type: 'number',
            defaultValue: 2,
            min: 0,
            max: 10,
            description: 'Number of decimal places to display',
          },
        ],
      },
      defaultConfig: {
        decimalPlaces: 2,
      },
    },
    component: CalculatorModule,
  },
  {
    metadata: {
      id: 'specials',
      version: '1.0.0',
      title: 'Specials Manager',
      description: 'Manage promotional specials with POS codes and automatic expiration',
      author: 'System',
      category: 'sales',
      icon: Tag,
      tags: ['specials', 'promotions', 'discounts', 'pos', 'sales'],
      configSchema: {
        fields: [
          {
            key: 'showExpiredSpecials',
            label: 'Show Expired Specials',
            type: 'boolean',
            defaultValue: false,
            description: 'Display expired specials in the list',
          },
          {
            key: 'expiryWarningDays',
            label: 'Expiry Warning (days)',
            type: 'number',
            defaultValue: 3,
            min: 1,
            max: 30,
            description: 'Show warning when special expires within this many days',
          },
        ],
      },
      defaultConfig: {
        showExpiredSpecials: false,
        expiryWarningDays: 3,
      },
    },
    component: SpecialsModule,
  },
];

/**
 * Initialize the module registry with core modules.
 * Safe to call multiple times — registers any missing core modules without
 * duplicating ones already present (e.g. from a custom module registered first,
 * or during Vite HMR re-execution).
 */
export function initializeModuleRegistry(): void {
  const registry = ModuleRegistry.getInstance();

  // Register only modules that are not yet in the registry,
  // so newly added core modules are always picked up without warnings.
  CORE_MODULES.forEach(module => {
    if (!registry.has(module.metadata.id)) {
      registry.register(module);
    }
  });

  console.log(`Initialized module registry with ${registry.count()} core modules`);
}

/**
 * Get the module registry instance
 */
export function getModuleRegistry(): ModuleRegistry {
  return ModuleRegistry.getInstance();
}