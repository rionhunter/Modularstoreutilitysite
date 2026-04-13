import { useState, useEffect, cloneElement, isValidElement } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Module, ModuleType } from '../types/modules';
import { renderModuleById } from './modules/renderModuleById';
import { Calculator, Package, ListTodo, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

interface ColumnarDashboardProps {
  modules: Module[];
}

interface CollapsedState {
  [key: string]: boolean;
}

interface ColumnOrder {
  calculations: string[];
  stock: string[];
  tasks: string[];
}

interface DraggableModuleProps {
  moduleId: ModuleType;
  moduleName: string;
  index: number;
  columnType: 'calculations' | 'stock' | 'tasks';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  moveModule: (fromIndex: number, toIndex: number) => void;
  children: React.ReactNode;
}

const DraggableModule = ({
  moduleId,
  moduleName,
  index,
  columnType,
  isCollapsed,
  onToggleCollapse,
  moveModule,
  children,
}: DraggableModuleProps) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: `MODULE_${columnType}`,
    item: { index, moduleId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: `MODULE_${columnType}`,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveModule(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => preview(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="relative group"
    >
      {/* Collapsible header bar */}
      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b cursor-pointer hover:bg-muted/50 transition-colors">
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-2 flex-1 text-left"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            )}
            <span className="font-medium text-sm">{moduleName}</span>
          </button>
          <div
            ref={drag}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        {/* Module content */}
        {!isCollapsed && (
          <div className="p-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

const getModuleName = (moduleId: ModuleType): string => {
  const names: Record<ModuleType, string> = {
    'calculator': 'Calculator',
    'cash-calculator': 'Cash Calculator',
    'balance-calculator': 'Balance Calculator',
    'quote-system': 'Quick Quote',
    'stock-tracker': 'Stock Tracker',
    'transaction-calculator': 'Transaction Calculator',
    'task-tracker': 'Task Tracker',
    'specials': 'Specials',
  };
  return names[moduleId] || moduleId;
};

export function ColumnarDashboard({ modules }: ColumnarDashboardProps) {
  const enabledModules = modules.filter(m => m.enabled);

  // Load collapsed state from localStorage
  const [collapsedState, setCollapsedState] = useState<CollapsedState>(() => {
    const saved = localStorage.getItem('column-dashboard-collapsed');
    return saved ? JSON.parse(saved) : {};
  });

  // Load column order from localStorage
  const [columnOrder, setColumnOrder] = useState<ColumnOrder>(() => {
    const saved = localStorage.getItem('column-dashboard-order');
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Default order with calculator at the top
    const calcModules = enabledModules.filter(m => 
      ['calculator', 'cash-calculator', 'balance-calculator', 'quote-system'].includes(m.id)
    );
    
    // Sort with calculator first, then by order
    const sortedCalcModules = calcModules.sort((a, b) => {
      if (a.id === 'calculator') return -1;
      if (b.id === 'calculator') return 1;
      return a.order - b.order;
    });
    
    return {
      calculations: sortedCalcModules.map(m => m.id),
      stock: enabledModules
        .filter(m => ['stock-tracker', 'transaction-calculator'].includes(m.id))
        .sort((a, b) => a.order - b.order)
        .map(m => m.id),
      tasks: enabledModules
        .filter(m => ['task-tracker', 'specials'].includes(m.id))
        .sort((a, b) => a.order - b.order)
        .map(m => m.id),
    };
  });

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('column-dashboard-collapsed', JSON.stringify(collapsedState));
  }, [collapsedState]);

  // Save column order to localStorage
  useEffect(() => {
    localStorage.setItem('column-dashboard-order', JSON.stringify(columnOrder));
  }, [columnOrder]);

  const toggleCollapse = (moduleId: string) => {
    setCollapsedState(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const moveModuleInColumn = (
    columnType: 'calculations' | 'stock' | 'tasks',
    fromIndex: number,
    toIndex: number
  ) => {
    setColumnOrder(prev => {
      const newOrder = [...prev[columnType]];
      const [movedModule] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, movedModule);
      
      return {
        ...prev,
        [columnType]: newOrder,
      };
    });
  };

  const renderModule = (moduleId: ModuleType) => renderModuleById(moduleId);

  const renderColumn = (
    title: string,
    icon: any,
    columnType: 'calculations' | 'stock' | 'tasks',
    moduleIds: string[]
  ) => {
    if (moduleIds.length === 0) return null;

    return (
      <div className="flex flex-col h-full rounded-lg border bg-card/30">
        <div className="flex-shrink-0 px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
          <h2 className="flex items-center gap-2 font-semibold">
            {icon}
            {title}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
          {moduleIds.map((moduleId, index) => (
            <DraggableModule
              key={moduleId}
              moduleId={moduleId as ModuleType}
              moduleName={getModuleName(moduleId as ModuleType)}
              index={index}
              columnType={columnType}
              isCollapsed={collapsedState[moduleId] || false}
              onToggleCollapse={() => toggleCollapse(moduleId)}
              moveModule={(from, to) => moveModuleInColumn(columnType, from, to)}
            >
              {renderModule(moduleId as ModuleType)}
            </DraggableModule>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[calc(100vh-180px)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 h-full">
        {/* Calculations Column */}
        {renderColumn(
          'Calculations',
          <Calculator className="h-5 w-5 text-primary" />,
          'calculations',
          columnOrder.calculations
        )}

        {/* Stock & Inventory Column */}
        {renderColumn(
          'Stock & Inventory',
          <Package className="h-5 w-5 text-primary" />,
          'stock',
          columnOrder.stock
        )}

        {/* Tasks & Specials Column */}
        {renderColumn(
          'Tasks & Specials',
          <ListTodo className="h-5 w-5 text-primary" />,
          'tasks',
          columnOrder.tasks
        )}
      </div>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>💡 Click module titles to collapse/expand • Drag grip icons to reorder within columns</p>
      </div>
    </div>
  );
}