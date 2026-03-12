import { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Module, ModuleType } from '../types/modules';
import { CashCalculatorModule } from './modules/CashCalculatorModule';
import { TransactionCalculatorModule } from './modules/TransactionCalculatorModule';
import { TaskTrackerModule } from './modules/TaskTrackerModule';
import { QuoteSystemModule } from './modules/QuoteSystemModule';
import { StockTrackerModule } from './modules/StockTrackerModule';
import { BalanceCalculatorModule } from './modules/BalanceCalculatorModule';
import { CalculatorModule } from './modules/CalculatorModule';
import { SpecialsModule } from './modules/SpecialsModule';
import { GripVertical } from 'lucide-react';

interface ModulePosition {
  id: ModuleType;
  order: number;
}

interface DraggableModuleProps {
  module: Module;
  index: number;
  moveModule: (fromIndex: number, toIndex: number) => void;
}

const DraggableModule = ({ module, index, moveModule }: DraggableModuleProps) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'MODULE',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'MODULE',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveModule(item.index, index);
        item.index = index;
      }
    },
  });

  const renderModule = (moduleId: ModuleType) => {
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
  };

  return (
    <div
      ref={(node) => preview(drop(node))}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
      }}
      className="relative group h-fit self-start"
    >
      <div
        ref={drag}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-2 bg-background/80 backdrop-blur rounded-md border"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      {renderModule(module.id)}
    </div>
  );
};

interface BentoDashboardProps {
  modules: Module[];
  onModuleOrderChange: (modules: Module[]) => void;
}

export function BentoDashboard({ modules, onModuleOrderChange }: BentoDashboardProps) {
  const [orderedModules, setOrderedModules] = useState<Module[]>(() => {
    const saved = localStorage.getItem('dashboard-layout');
    if (saved) {
      const positions: ModulePosition[] = JSON.parse(saved);
      return modules
        .filter(m => m.enabled)
        .sort((a, b) => {
          const orderA = positions.find(p => p.id === a.id)?.order ?? a.order;
          const orderB = positions.find(p => p.id === b.id)?.order ?? b.order;
          return orderA - orderB;
        });
    }
    return modules.filter(m => m.enabled).sort((a, b) => a.order - b.order);
  });

  useEffect(() => {
    const enabled = modules.filter(m => m.enabled).sort((a, b) => a.order - b.order);
    setOrderedModules(enabled);
  }, [modules]);

  const moveModule = (fromIndex: number, toIndex: number) => {
    const newModules = [...orderedModules];
    const [movedModule] = newModules.splice(fromIndex, 1);
    newModules.splice(toIndex, 0, movedModule);
    
    setOrderedModules(newModules);
    
    // Save to localStorage
    const positions: ModulePosition[] = newModules.map((m, idx) => ({
      id: m.id,
      order: idx,
    }));
    localStorage.setItem('dashboard-layout', JSON.stringify(positions));
    
    // Update parent
    const updatedModules = modules.map(m => {
      const pos = positions.find(p => p.id === m.id);
      return pos ? { ...m, order: pos.order } : m;
    });
    onModuleOrderChange(updatedModules);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 items-start">
        {orderedModules.map((module, index) => (
          <DraggableModule
            key={module.id}
            module={module}
            index={index}
            moveModule={moveModule}
          />
        ))}
      </div>
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>💡 Hover over modules to drag and reorder your dashboard</p>
      </div>
    </div>
  );
}