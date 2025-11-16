export type ModuleType = 
  | 'cash-calculator'
  | 'transaction-calculator'
  | 'task-tracker'
  | 'quote-system'
  | 'stock-tracker'
  | 'balance-calculator'
  | 'calculator';

export interface Module {
  id: ModuleType;
  title: string;
  description: string;
  enabled: boolean;
  order: number;
}

export interface CashEntry {
  denomination: number;
  count: number;
}

export interface TransactionCategory {
  id: string;
  name: string;
  amount: number;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  createdAt: Date;
  dueDate?: Date;
  completed: boolean;
  alertDays?: number;
  dirtyItems?: Array<{
    barcode: string;
    location: string;
  }>;
}

export interface Quote {
  id: string;
  customerName: string;
  items: QuoteItem[];
  total: number;
  createdAt: Date;
  expiryDate?: Date;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface StockItem {
  id: string;
  name: string;
  location: string;
  quantity: number;
  sku?: string;
}

export type SlotType = 'single' | 'tray' | 'inactive';

export interface BaySlot {
  row: number;
  col: number;
  type: SlotType;
  traySlots?: number; // Number of sub-slots if type is 'tray'
}

export interface Bay {
  id: string;
  name: string;
  shelves: number; // rows
  columns: number; // cols
  slots: BaySlot[];
  hasDrawers: boolean;
  drawerRows?: number;
  drawerColumns?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  customIcon?: string; // base64 encoded PNG
  iconUrl?: string; // URL to online image
  iconRotation?: number; // rotation in degrees (0, 90, 180, 270)
  showLabel?: boolean;
  showDimensions?: boolean;
}

export interface LayoutElement {
  id: string;
  type: 'bay' | 'obstruction' | 'landmark';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  bayData?: Bay;
  color?: string;
  customIcon?: string; // base64 encoded PNG
  iconUrl?: string; // URL to online image
  iconRotation?: number; // rotation in degrees (0, 90, 180, 270)
  showLabel?: boolean;
  showDimensions?: boolean;
}

export interface StoreLayout {
  gridWidth: number;
  gridHeight: number;
  elements: LayoutElement[];
  layoutWidth?: number; // physical width in meters/feet
  layoutHeight?: number; // physical height in meters/feet
  layoutUnit?: 'meters' | 'feet';
}
