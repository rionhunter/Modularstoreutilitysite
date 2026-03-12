import { ModuleType } from '../../types/modules';
import { CashCalculatorModule } from './CashCalculatorModule';
import { TransactionCalculatorModule } from './TransactionCalculatorModule';
import { TaskTrackerModule } from './TaskTrackerModule';
import { QuoteSystemModule } from './QuoteSystemModule';
import { StockTrackerModule } from './StockTrackerModule';
import { BalanceCalculatorModule } from './BalanceCalculatorModule';
import { CalculatorModule } from './CalculatorModule';
import { SpecialsModule } from './SpecialsModule';

interface ModuleContentWrapperProps {
  moduleId: ModuleType;
}

/**
 * Renders module content with its own Card wrapper intact.
 * The columnar dashboard will handle the collapsible wrapper.
 */
export function ModuleContentWrapper({ moduleId }: ModuleContentWrapperProps) {
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
