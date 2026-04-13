import { ReactElement } from 'react';
import { ModuleType } from '../../types/modules';
import { CashCalculatorModule } from './CashCalculatorModule';
import { TransactionCalculatorModule } from './TransactionCalculatorModule';
import { TaskTrackerModule } from './TaskTrackerModule';
import { QuoteSystemModule } from './QuoteSystemModule';
import { StockTrackerModule } from './StockTrackerModule';
import { BalanceCalculatorModule } from './BalanceCalculatorModule';
import { CalculatorModule } from './CalculatorModule';
import { SpecialsModule } from './SpecialsModule';

/**
 * Returns the component for a given module ID.
 * Shared between BentoDashboard and ColumnarDashboard.
 */
export function renderModuleById(moduleId: ModuleType): ReactElement | null {
  switch (moduleId) {
    case 'cash-calculator':
      return <CashCalculatorModule />;
    case 'transaction-calculator':
      return <TransactionCalculatorModule />;
    case 'task-tracker':
      return <TaskTrackerModule />;
    case 'quote-system':
      return <QuoteSystemModule />;
    case 'stock-tracker':
      return <StockTrackerModule />;
    case 'balance-calculator':
      return <BalanceCalculatorModule />;
    case 'calculator':
      return <CalculatorModule />;
    case 'specials':
      return <SpecialsModule />;
    default:
      return null;
  }
}
