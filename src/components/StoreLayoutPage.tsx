import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  LayoutGrid, 
  Box,
  AlertTriangle,
  MapPin,
  Download,
  Upload,
  Edit,
  Trash2,
  Save,
  Grid3x3,
  ChevronLeft,
  ChevronRight,
  Check,
  Settings,
  Image as ImageIcon,
  RotateCw
} from 'lucide-react';
import { toast } from 'sonner';
import { LayoutElement, Bay, BaySlot, SlotType, StoreLayout } from '../types/modules';

const CELL_SIZE = 40;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 15;

type ToolMode = 'select' | 'bay' | 'obstruction' | 'landmark';

export function StoreLayoutPage() {
  const [storeLayout, setStoreLayout] = useState<StoreLayout>(() => {
    const saved = localStorage.getItem('store-layout-full');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure gridWidth and gridHeight exist
      return {
        gridWidth: parsed.gridWidth || GRID_WIDTH,
        gridHeight: parsed.gridHeight || GRID_HEIGHT,
        elements: parsed.elements || [],
        layoutWidth: parsed.layoutWidth || 20,
        layoutHeight: parsed.layoutHeight || 15,
        layoutUnit: parsed.layoutUnit || 'meters'
      };
    }
    // Migrate old data
    const oldLayout = localStorage.getItem('store-layout');
    if (oldLayout) {
      return {
        gridWidth: GRID_WIDTH,
        gridHeight: GRID_HEIGHT,
        elements: JSON.parse(oldLayout),
        layoutWidth: 20,
        layoutHeight: 15,
        layoutUnit: 'meters'
      };
    }
    return {
      gridWidth: GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
      elements: [],
      layoutWidth: 20,
      layoutHeight: 15,
      layoutUnit: 'meters'
    };
  });

  const layout = storeLayout.elements || [];
  const [selectedElement, setSelectedElement] = useState<LayoutElement | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  // Bay configuration state
  const [bayName, setBayName] = useState('');
  const [shelves, setShelves] = useState(5);
  const [columns, setColumns] = useState(3);
  const [hasDrawers, setHasDrawers] = useState(false);
  const [drawerRows, setDrawerRows] = useState(2);
  const [drawerColumns, setDrawerColumns] = useState(3);
  const [baySlots, setBaySlots] = useState<BaySlot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [bulkSlotType, setBulkSlotType] = useState<SlotType>('single');
  const [bulkTrayCount, setBulkTrayCount] = useState(3);
  const [customIcon, setCustomIcon] = useState<string>('');
  const [iconUrl, setIconUrl] = useState<string>('');
  const [iconRotation, setIconRotation] = useState<number>(0);
  const [showLabel, setShowLabel] = useState(true);
  const [showDimensions, setShowDimensions] = useState(false);

  // Size adjustment state
  const [elementWidth, setElementWidth] = useState(2);
  const [elementHeight, setElementHeight] = useState(3);
  const [isResizing, setIsResizing] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Count scanned products
  const scannedProductCount = (() => {
    const saved = localStorage.getItem('stock-take-scanned-products');
    if (saved) {
      try {
        const products = JSON.parse(saved);
        return Array.isArray(products) ? products.length : 0;
      } catch {
        return 0;
      }
    }
    return 0;
  })();

  const saveToLocalStorage = (updatedLayout: StoreLayout) => {
    localStorage.setItem('store-layout-full', JSON.stringify(updatedLayout));
    // Also save old format for backwards compatibility
    localStorage.setItem('store-layout', JSON.stringify(updatedLayout.elements));
    localStorage.setItem('store-layout-locations', JSON.stringify(
      updatedLayout.elements
        .filter(el => el.type === 'bay')
        .map(el => ({
          id: el.id,
          name: el.name,
          bayData: el.bayData,
        }))
    ));
  };

  const setLayout = (elements: LayoutElement[]) => {
    const updatedLayout = { ...storeLayout, elements };
    setStoreLayout(updatedLayout);
    saveToLocalStorage(updatedLayout);
  };

  const initializeBaySlots = (rows: number, cols: number): BaySlot[] => {
    const slots: BaySlot[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        slots.push({
          row,
          col,
          type: 'single',
          traySlots: 0,
        });
      }
    }
    return slots;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (toolMode === 'select') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    const width = toolMode === 'bay' ? elementWidth : 1;
    const height = toolMode === 'bay' ? elementHeight : 1;

    // Check bounds
    if (x + width > storeLayout.gridWidth || y + height > storeLayout.gridHeight) {
      toast.error('Element exceeds grid bounds');
      return;
    }

    // Check if space is occupied
    const occupied = layout.some(el => 
      !(x + width <= el.x || x >= el.x + el.width ||
        y + height <= el.y || y >= el.y + el.height)
    );

    if (occupied) {
      toast.error('Space is occupied');
      return;
    }

    const newElement: LayoutElement = {
      id: Date.now().toString(),
      type: toolMode as 'bay' | 'obstruction' | 'landmark',
      name: `${toolMode.charAt(0).toUpperCase() + toolMode.slice(1)} ${layout.length + 1}`,
      x,
      y,
      width,
      height,
      color: toolMode === 'obstruction' ? '#ef4444' : toolMode === 'landmark' ? '#3b82f6' : undefined,
    };

    if (toolMode === 'bay') {
      setSelectedElement(newElement);
      setBayName(newElement.name);
      setShelves(5);
      setColumns(3);
      setHasDrawers(false);
      setBaySlots(initializeBaySlots(5, 3));
      setSelectedSlots(new Set());
      setCustomIcon('');
      setIconUrl('');
      setIconRotation(0);
      setShowLabel(true);
      setShowDimensions(false);
      setConfigDialogOpen(true);
    } else {
      const newLayout = [...layout, newElement];
      const updatedStoreLayout = { ...storeLayout, elements: newLayout };
      setStoreLayout(updatedStoreLayout);
      saveToLocalStorage(updatedStoreLayout);
      toast.success(`${toolMode} added`);
    }
  };

  const handleElementClick = (element: LayoutElement, e: React.MouseEvent) => {
    e.stopPropagation();
    if (toolMode === 'select') {
      setSelectedElement(element);
    }
  };

  const handleMouseDown = (element: LayoutElement, e: React.MouseEvent) => {
    if (toolMode !== 'select') return;
    e.stopPropagation();
    setIsDragging(true);
    setSelectedElement(element);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragStart({
      x: Math.floor((e.clientX - rect.left) / CELL_SIZE) - element.x,
      y: Math.floor((e.clientY - rect.top) / CELL_SIZE) - element.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectedElement || !dragStart) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newX = Math.floor((e.clientX - rect.left) / CELL_SIZE) - dragStart.x;
    const newY = Math.floor((e.clientY - rect.top) / CELL_SIZE) - dragStart.y;

    if (newX < 0 || newY < 0 || 
        newX + selectedElement.width > storeLayout.gridWidth || 
        newY + selectedElement.height > storeLayout.gridHeight) {
      return;
    }

    const collision = layout.some(el => 
      el.id !== selectedElement.id &&
      !(newX + selectedElement.width <= el.x || newX >= el.x + el.width ||
        newY + selectedElement.height <= el.y || newY >= el.y + el.height)
    );

    if (collision) return;

    const newLayout = layout.map(el =>
      el.id === selectedElement.id ? { ...el, x: newX, y: newY } : el
    );
    const updatedStoreLayout = { ...storeLayout, elements: newLayout };
    setStoreLayout(updatedStoreLayout);
    setSelectedElement(prev => prev ? { ...prev, x: newX, y: newY } : null);
    saveToLocalStorage(updatedStoreLayout);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const deleteElement = (id: string) => {
    const newLayout = layout.filter(el => el.id !== id);
    const updatedStoreLayout = { ...storeLayout, elements: newLayout };
    setStoreLayout(updatedStoreLayout);
    saveToLocalStorage(updatedStoreLayout);
    setSelectedElement(null);
    toast.success('Element deleted');
  };

  const updateElementName = (id: string, name: string) => {
    const newLayout = layout.map(el => el.id === id ? { ...el, name } : el);
    const updatedStoreLayout = { ...storeLayout, elements: newLayout };
    setStoreLayout(updatedStoreLayout);
    saveToLocalStorage(updatedStoreLayout);
    if (selectedElement?.id === id) {
      setSelectedElement({ ...selectedElement, name });
    }
  };

  const updateElementSize = (id: string, width: number, height: number) => {
    const element = layout.find(el => el.id === id);
    if (!element) return;

    // Check bounds
    if (element.x + width > storeLayout.gridWidth || element.y + height > storeLayout.gridHeight) {
      toast.error('Size exceeds grid bounds');
      return;
    }

    // Check collision
    const collision = layout.some(el => 
      el.id !== id &&
      !(element.x + width <= el.x || element.x >= el.x + el.width ||
        element.y + height <= el.y || element.y >= el.y + el.height)
    );

    if (collision) {
      toast.error('Resize would overlap another element');
      return;
    }

    const newLayout = layout.map(el => 
      el.id === id ? { ...el, width, height } : el
    );
    const updatedStoreLayout = { ...storeLayout, elements: newLayout };
    setStoreLayout(updatedStoreLayout);
    saveToLocalStorage(updatedStoreLayout);
    if (selectedElement?.id === id) {
      setSelectedElement({ ...selectedElement, width, height });
    }
  };

  const toggleSlotSelection = (row: number, col: number) => {
    const slotKey = `${row}-${col}`;
    const newSelected = new Set(selectedSlots);
    if (newSelected.has(slotKey)) {
      newSelected.delete(slotKey);
    } else {
      newSelected.add(slotKey);
    }
    setSelectedSlots(newSelected);
  };

  const applyBulkSlotType = () => {
    if (selectedSlots.size === 0) {
      toast.error('No slots selected');
      return;
    }

    setBaySlots(prev =>
      prev.map(slot => {
        const slotKey = `${slot.row}-${slot.col}`;
        if (selectedSlots.has(slotKey)) {
          return {
            ...slot,
            type: bulkSlotType,
            traySlots: bulkSlotType === 'tray' ? bulkTrayCount : 0,
          };
        }
        return slot;
      })
    );

    toast.success(`Applied ${bulkSlotType} to ${selectedSlots.size} slot(s)`);
    setSelectedSlots(new Set());
  };

  const updateBayDimensions = (newShelves: number, newColumns: number) => {
    setShelves(newShelves);
    setColumns(newColumns);
    
    const newSlots: BaySlot[] = [];
    for (let row = 0; row < newShelves; row++) {
      for (let col = 0; col < newColumns; col++) {
        const existingSlot = baySlots.find(s => s.row === row && s.col === col);
        newSlots.push(existingSlot || {
          row,
          col,
          type: 'single',
          traySlots: 0,
        });
      }
    }
    setBaySlots(newSlots);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/png')) {
      toast.error('Please upload a PNG file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCustomIcon(base64);
      toast.success('Icon uploaded');
    };
    reader.readAsDataURL(file);
  };

  const saveBayConfig = () => {
    if (!selectedElement) return;

    const bayData: Bay = {
      id: selectedElement.id,
      name: bayName,
      shelves,
      columns,
      slots: baySlots,
      hasDrawers,
      drawerRows: hasDrawers ? drawerRows : undefined,
      drawerColumns: hasDrawers ? drawerColumns : undefined,
      x: selectedElement.x,
      y: selectedElement.y,
      width: selectedElement.width,
      height: selectedElement.height,
      customIcon: customIcon || undefined,
      iconUrl: iconUrl || undefined,
      iconRotation: iconRotation || undefined,
      showLabel,
      showDimensions,
    };

    const newElement: LayoutElement = { 
      ...selectedElement, 
      name: bayName, 
      bayData,
      customIcon: customIcon || undefined,
      iconUrl: iconUrl || undefined,
      iconRotation: iconRotation || undefined,
      showLabel,
      showDimensions,
    };
    
    let newLayout: LayoutElement[];
    if (layout.some(el => el.id === selectedElement.id)) {
      newLayout = layout.map(el => (el.id === selectedElement.id ? newElement : el));
    } else {
      newLayout = [...layout, newElement];
    }
    
    const updatedStoreLayout = { ...storeLayout, elements: newLayout };
    setStoreLayout(updatedStoreLayout);
    saveToLocalStorage(updatedStoreLayout);
    setConfigDialogOpen(false);
    toast.success('Bay configured');
    setSelectedElement(null);
  };

  const editBay = (element: LayoutElement) => {
    if (element.type !== 'bay') return;
    setSelectedElement(element);
    if (element.bayData) {
      setBayName(element.bayData.name);
      setShelves(element.bayData.shelves);
      setColumns(element.bayData.columns);
      setBaySlots(element.bayData.slots || initializeBaySlots(element.bayData.shelves, element.bayData.columns));
      setHasDrawers(element.bayData.hasDrawers);
      setDrawerRows(element.bayData.drawerRows || 2);
      setDrawerColumns(element.bayData.drawerColumns || 3);
      setCustomIcon(element.bayData.customIcon || element.customIcon || '');
      setIconUrl(element.bayData.iconUrl || element.iconUrl || '');
      setIconRotation(element.bayData.iconRotation || element.iconRotation || 0);
      setShowLabel(element.bayData.showLabel ?? element.showLabel ?? true);
      setShowDimensions(element.bayData.showDimensions ?? element.showDimensions ?? false);
    } else {
      // Set defaults for unconfigured bay
      setBayName(element.name);
      setShelves(5);
      setColumns(3);
      setBaySlots(initializeBaySlots(5, 3));
      setHasDrawers(false);
      setDrawerRows(2);
      setDrawerColumns(3);
      setCustomIcon(element.customIcon || '');
      setIconUrl(element.iconUrl || '');
      setIconRotation(element.iconRotation || 0);
      setShowLabel(element.showLabel ?? true);
      setShowDimensions(element.showDimensions ?? false);
    }
    setSelectedSlots(new Set());
    setConfigDialogOpen(true);
  };

  const editElementDisplay = (element: LayoutElement) => {
    setSelectedElement(element);
    setCustomIcon(element.customIcon || '');
    setIconUrl(element.iconUrl || '');
    setIconRotation(element.iconRotation || 0);
    setShowLabel(element.showLabel ?? true);
    setShowDimensions(element.showDimensions ?? false);
    
    if (element.type === 'bay' && element.bayData) {
      setBayName(element.bayData.name);
    }
  };

  const saveElementDisplay = () => {
    if (!selectedElement) return;

    const updatedElement: LayoutElement = {
      ...selectedElement,
      customIcon: customIcon || undefined,
      iconUrl: iconUrl || undefined,
      iconRotation: iconRotation || undefined,
      showLabel,
      showDimensions,
    };

    if (updatedElement.type === 'bay' && updatedElement.bayData) {
      updatedElement.bayData = {
        ...updatedElement.bayData,
        customIcon: customIcon || undefined,
        iconUrl: iconUrl || undefined,
        iconRotation: iconRotation || undefined,
        showLabel,
        showDimensions,
      };
    }

    const newLayout = layout.map(el => el.id === selectedElement.id ? updatedElement : el);
    const updatedStoreLayout = { ...storeLayout, elements: newLayout };
    setStoreLayout(updatedStoreLayout);
    saveToLocalStorage(updatedStoreLayout);
    toast.success('Display settings updated');
  };

  const exportLayout = () => {
    // Include scanned stock data in the export
    const scannedProducts = localStorage.getItem('stock-take-scanned-products');
    const exportData = {
      ...storeLayout,
      scannedProducts: scannedProducts ? JSON.parse(scannedProducts) : []
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `store-layout-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success('Layout and scanned stock exported');
  };

  const importLayout = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        
        // Check if it's the new format with StoreLayout structure
        if (imported.elements && Array.isArray(imported.elements)) {
          const newLayout: StoreLayout = {
            gridWidth: imported.gridWidth || GRID_WIDTH,
            gridHeight: imported.gridHeight || GRID_HEIGHT,
            elements: imported.elements,
            layoutWidth: imported.layoutWidth || 20,
            layoutHeight: imported.layoutHeight || 15,
            layoutUnit: imported.layoutUnit || 'meters'
          };
          setStoreLayout(newLayout);
          saveToLocalStorage(newLayout);
          
          // Import scanned products if they exist
          if (imported.scannedProducts && Array.isArray(imported.scannedProducts)) {
            localStorage.setItem('stock-take-scanned-products', JSON.stringify(imported.scannedProducts));
            // Dispatch event so Stock Tracker updates
            window.dispatchEvent(new Event('stock-take-updated'));
            toast.success('Layout and scanned stock imported successfully');
          } else {
            toast.success('Layout imported successfully');
          }
        } else if (Array.isArray(imported)) {
          // Old format - just elements array
          const newLayout: StoreLayout = {
            gridWidth: storeLayout.gridWidth,
            gridHeight: storeLayout.gridHeight,
            elements: imported,
            layoutWidth: 20,
            layoutHeight: 15,
            layoutUnit: 'meters'
          };
          setStoreLayout(newLayout);
          saveToLocalStorage(newLayout);
          toast.success('Layout imported successfully');
        } else {
          throw new Error('Invalid format');
        }
      } catch (error) {
        toast.error('Invalid layout file');
      }
    };
    reader.readAsText(file);
  };

  const getElementColor = (element: LayoutElement) => {
    if (element.type === 'bay') return 'bg-green-500/20 border-green-500';
    if (element.type === 'obstruction') return 'bg-red-500/20 border-red-500';
    if (element.type === 'landmark') return 'bg-blue-500/20 border-blue-500';
    return 'bg-gray-500/20 border-gray-500';
  };

  const getElementIcon = (element: LayoutElement, inGrid: boolean = true) => {
    const iconSrc = element.iconUrl || element.customIcon;
    const rotation = element.iconRotation || 0;
    const showLabel = element.showLabel ?? true;
    const showDimensions = element.showDimensions ?? false;
    
    if (iconSrc) {
      // If only icon is visible (no label or dimensions), expand to fill container
      // Only apply icon-only mode when rendered in the grid
      const iconOnlyMode = inGrid && !showLabel && !showDimensions;
      
      if (iconOnlyMode && element.width && element.height) {
        // Calculate max size based on element dimensions, leaving small padding
        const maxWidth = (element.width * CELL_SIZE) - 8;
        const maxHeight = (element.height * CELL_SIZE) - 8;
        
        return (
          <div className="absolute inset-0 flex items-center justify-center p-1">
            <img 
              src={iconSrc} 
              alt={element.name}
              style={{
                transform: `rotate(${rotation}deg)`,
                maxWidth: `${maxWidth}px`,
                maxHeight: `${maxHeight}px`,
                width: 'auto',
                height: 'auto',
              }}
              className="object-contain"
            />
          </div>
        );
      }
      
      return (
        <img 
          src={iconSrc} 
          alt={element.name}
          style={{ transform: `rotate(${rotation}deg)` }}
          className="h-8 w-8 object-contain"
        />
      );
    }
    
    if (element.type === 'bay') return <Box className="h-3 w-3" />;
    if (element.type === 'obstruction') return <AlertTriangle className="h-3 w-3" />;
    if (element.type === 'landmark') return <MapPin className="h-3 w-3" />;
    return null;
  };

  const getSlotColor = (type: SlotType, isSelected: boolean) => {
    if (isSelected) return 'bg-primary/40 border-primary ring-2 ring-primary';
    if (type === 'inactive') return 'bg-red-500/20 border-red-500';
    if (type === 'tray') return 'bg-blue-500/30 border-blue-500';
    return 'bg-green-500/20 border-green-500';
  };

  const bays = layout.filter(el => el.type === 'bay');

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={toolMode === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setToolMode('select')}
          >
            Select/Move
          </Button>
          <Button
            variant={toolMode === 'bay' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setToolMode('bay')}
          >
            <Box className="h-4 w-4 mr-2" />
            Add Bay
          </Button>
          <Button
            variant={toolMode === 'obstruction' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setToolMode('obstruction')}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Obstruction
          </Button>
          <Button
            variant={toolMode === 'landmark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setToolMode('landmark')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Landmark
          </Button>
        </div>

        {toolMode === 'bay' && (
          <div className="flex gap-2 items-center">
            <Label className="text-sm">Size:</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={elementWidth}
              onChange={e => setElementWidth(parseInt(e.target.value) || 1)}
              className="w-16 h-8"
            />
            <span className="text-sm">×</span>
            <Input
              type="number"
              min="1"
              max="10"
              value={elementHeight}
              onChange={e => setElementHeight(parseInt(e.target.value) || 1)}
              className="w-16 h-8"
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSettingsDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={exportLayout}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = (e) => importLayout(e as any);
              input.click();
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      <Tabs defaultValue="canvas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="canvas">Canvas</TabsTrigger>
          <TabsTrigger value="bays">Bays ({bays.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="canvas" className="space-y-4">
          {/* Canvas */}
          <div className="border rounded-lg p-4 bg-muted/30 overflow-auto">
            <div
              ref={canvasRef}
              className="relative bg-background border-2 border-dashed cursor-crosshair mx-auto"
              style={{
                width: storeLayout.gridWidth * CELL_SIZE,
                height: storeLayout.gridHeight * CELL_SIZE,
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
              }}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              aria-label="Store layout canvas"
            >
              {layout.map(element => (
                <div
                  key={element.id}
                  className={`absolute border-2 ${getElementColor(element)} rounded transition-all ${
                    selectedElement?.id === element.id ? 'ring-2 ring-primary' : ''
                  } ${toolMode === 'select' ? 'cursor-move' : ''}`}
                  style={{
                    left: element.x * CELL_SIZE,
                    top: element.y * CELL_SIZE,
                    width: element.width * CELL_SIZE,
                    height: element.height * CELL_SIZE,
                  }}
                  onClick={(e) => handleElementClick(element, e)}
                  onMouseDown={(e) => handleMouseDown(element, e)}
                  onKeyDown={(e) => {
                    if (toolMode === 'select' && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      setSelectedElement(element);
                    }
                  }}
                  role={toolMode === 'select' ? 'button' : undefined}
                  tabIndex={toolMode === 'select' ? 0 : -1}
                  aria-label={toolMode === 'select' ? `${element.type} ${element.name}` : undefined}
                >
                  <div className="p-1 flex flex-col items-center justify-center h-full text-center overflow-hidden relative">
                    {getElementIcon(element)}
                    {(element.showLabel ?? true) && (
                      <span className="text-xs mt-1 break-words line-clamp-2">{element.name}</span>
                    )}
                    {element.showDimensions && element.type === 'bay' && element.bayData && (
                      <span className="text-xs text-muted-foreground">
                        {element.bayData.shelves}×{element.bayData.columns}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Element Info */}
          {selectedElement && (
            <div className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-muted/50 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getElementIcon(selectedElement, false)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input
                      value={selectedElement.name}
                      onChange={(e) => updateElementName(selectedElement.id, e.target.value)}
                      className="h-7 max-w-[200px]"
                    />
                    <Badge variant="outline" className="text-xs">
                      {selectedElement.type}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Position: ({selectedElement.x}, {selectedElement.y})
                  </div>
                </div>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <div className="flex gap-1 items-center">
                  <Label className="text-xs">Size:</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={selectedElement.width}
                    onChange={(e) => updateElementSize(selectedElement.id, parseInt(e.target.value) || 1, selectedElement.height)}
                    className="w-12 h-7 text-xs"
                  />
                  <span className="text-xs">×</span>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={selectedElement.height}
                    onChange={(e) => updateElementSize(selectedElement.id, selectedElement.width, parseInt(e.target.value) || 1)}
                    className="w-12 h-7 text-xs"
                  />
                </div>
                {selectedElement.type === 'bay' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editBay(selectedElement)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteElement(selectedElement.id)}
                  aria-label={`Delete ${selectedElement.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bays">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {bays.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No bays configured yet. Add bays from the canvas tab.
                </div>
              ) : (
                bays.map(bay => (
                  <div key={bay.id} className={`border rounded-lg ${(bay.iconUrl || bay.customIcon) ? 'flex gap-4' : 'p-4 space-y-2'}`}>
                    {(bay.iconUrl || bay.customIcon) && (
                      <div className="w-24 h-24 flex-shrink-0 bg-muted rounded-l-lg overflow-hidden">
                        <img 
                          src={bay.iconUrl || bay.customIcon} 
                          alt={bay.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className={`flex-1 ${(bay.iconUrl || bay.customIcon) ? 'py-4 pr-4' : ''} space-y-2`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            {!(bay.iconUrl || bay.customIcon) && (
                              <Box className="h-4 w-4" />
                            )}
                            <span>{bay.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Position: ({bay.x}, {bay.y}) • Size: {bay.width}×{bay.height}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editBay(bay)}
                          aria-label={`Edit ${bay.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      {bay.bayData && (
                        <div className="space-y-2 pt-2 border-t">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Shelves:</span>
                            <span className="ml-2">{bay.bayData.shelves}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Columns:</span>
                            <span className="ml-2">{bay.bayData.columns}</span>
                          </div>
                          {bay.bayData.hasDrawers && (
                            <>
                              <div>
                                <span className="text-muted-foreground">Drawer Rows:</span>
                                <span className="ml-2">{bay.bayData.drawerRows}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Drawer Cols:</span>
                                <span className="ml-2">{bay.bayData.drawerColumns}</span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex gap-2 text-xs">
                          <Badge variant="secondary">
                            {bay.bayData.slots?.filter(s => s.type === 'tray').length || 0} Trays
                          </Badge>
                          <Badge variant="secondary">
                            {bay.bayData.slots?.filter(s => s.type === 'inactive').length || 0} Inactive
                          </Badge>
                        </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Bay Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={(open) => {
        setConfigDialogOpen(open);
        if (!open && selectedElement && !layout.find(el => el.id === selectedElement.id)) {
          // Dialog closed without saving for a new bay that wasn't added yet
          setSelectedElement(null);
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Grid3x3 className="h-5 w-5" />
              Configure Bay
            </DialogTitle>
            <DialogDescription>
              Configure bay size, display options, slot types, and drawer settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <Label htmlFor="bay-name">Bay Name</Label>
              <Input
                id="bay-name"
                value={bayName}
                onChange={e => setBayName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shelves">Shelves (Rows)</Label>
                <Input
                  id="shelves"
                  type="number"
                  min="1"
                  max="20"
                  value={shelves}
                  onChange={e => updateBayDimensions(parseInt(e.target.value) || 1, columns)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="columns">Columns</Label>
                <Input
                  id="columns"
                  type="number"
                  min="1"
                  max="20"
                  value={columns}
                  onChange={e => updateBayDimensions(shelves, parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Display Settings
              </h4>
              
              <div>
                <Label>Custom Icon (PNG)</Label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png"
                    onChange={handleIconUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Icon
                  </Button>
                  {customIcon && (
                    <>
                      <img src={customIcon} alt="Preview" className="h-12 w-12 border rounded object-contain" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCustomIcon('')}
                      >
                        Remove
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a transparent PNG for custom bay icon
                </p>
              </div>

              <div>
                <Label htmlFor="icon-url">Or Icon URL</Label>
                <Input
                  id="icon-url"
                  type="url"
                  placeholder="https://example.com/icon.png"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Link to an online image (will override uploaded icon)
                </p>
              </div>

              {(customIcon || iconUrl) && (
                <div>
                  <Label>Icon Rotation</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIconRotation((iconRotation + 90) % 360)}
                    >
                      <RotateCw className="h-4 w-4 mr-2" />
                      Rotate 90°
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Current: {iconRotation}°
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="show-label">Show Label</Label>
                <Switch
                  id="show-label"
                  checked={showLabel}
                  onCheckedChange={setShowLabel}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-dimensions">Show Dimensions</Label>
                <Switch
                  id="show-dimensions"
                  checked={showDimensions}
                  onCheckedChange={setShowDimensions}
                />
              </div>
            </div>

            {/* Bulk Selection Controls */}
            {selectedSlots.size > 0 && (
              <div className="p-3 border rounded-lg bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {selectedSlots.size} slot{selectedSlots.size > 1 ? 's' : ''} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSlots(new Set())}
                  >
                    Clear
                  </Button>
                </div>
                <RadioGroup value={bulkSlotType} onValueChange={(v) => setBulkSlotType(v as SlotType)}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="single" id="bulk-single" />
                      <Label htmlFor="bulk-single" className="cursor-pointer">Single</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tray" id="bulk-tray" />
                      <Label htmlFor="bulk-tray" className="cursor-pointer">Tray</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="inactive" id="bulk-inactive" />
                      <Label htmlFor="bulk-inactive" className="cursor-pointer">Inactive</Label>
                    </div>
                  </div>
                </RadioGroup>
                {bulkSlotType === 'tray' && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Tray slots:</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setBulkTrayCount(Math.max(1, bulkTrayCount - 1))}
                      aria-label="Decrease tray slot count"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm min-w-[20px] text-center">{bulkTrayCount}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setBulkTrayCount(Math.min(20, bulkTrayCount + 1))}
                      aria-label="Increase tray slot count"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Button onClick={applyBulkSlotType} size="sm" className="w-full">
                  <Check className="h-4 w-4 mr-2" />
                  Apply to Selected
                </Button>
              </div>
            )}

            {/* Visual Grid */}
            <div className="space-y-2">
              <Label>Bay Grid Configuration (Click to select, shift+click for range)</Label>
              <div className="border rounded-lg p-3 bg-muted/30">
                <div 
                  className="grid gap-1 mx-auto"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    maxWidth: `${Math.min(columns * 80, 800)}px`
                  }}
                >
                  {baySlots.map((slot) => {
                    const slotKey = `${slot.row}-${slot.col}`;
                    const isSelected = selectedSlots.has(slotKey);
                    return (
                      <button
                        key={slotKey}
                        type="button"
                        className={`border-2 rounded p-1.5 cursor-pointer transition-all ${getSlotColor(slot.type, isSelected)}`}
                        onClick={() => toggleSlotSelection(slot.row, slot.col)}
                        aria-pressed={isSelected}
                        aria-label={`Toggle ${slot.type} slot shelf ${slot.row + 1} column ${slot.col + 1}`}
                      >
                        <div className="text-xs mb-0.5">
                          S{slot.row + 1}C{slot.col + 1}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs capitalize flex-1">
                            {slot.type === 'tray' ? `T:${slot.traySlots}` : slot.type}
                          </span>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 text-xs justify-center">
                <Badge variant="outline" className="bg-green-500/20">Single</Badge>
                <Badge variant="outline" className="bg-blue-500/30">Tray</Badge>
                <Badge variant="outline" className="bg-red-500/20">Inactive</Badge>
              </div>
            </div>

            {/* Drawers Section */}
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="has-drawers">Has Drawers</Label>
                <Switch
                  id="has-drawers"
                  checked={hasDrawers}
                  onCheckedChange={setHasDrawers}
                />
              </div>

              {hasDrawers && (
                <div className="grid grid-cols-2 gap-4 pl-4">
                  <div>
                    <Label htmlFor="drawer-rows">Drawer Rows</Label>
                    <Input
                      id="drawer-rows"
                      type="number"
                      min="1"
                      value={drawerRows}
                      onChange={e => setDrawerRows(parseInt(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="drawer-cols">Drawer Columns</Label>
                    <Input
                      id="drawer-cols"
                      type="number"
                      min="1"
                      value={drawerColumns}
                      onChange={e => setDrawerColumns(parseInt(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground">
                    Each drawer slot acts as a tray with vertical sub-slots
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <Button onClick={saveBayConfig} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Bay Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Layout Settings
            </DialogTitle>
            <DialogDescription>
              Adjust grid and physical layout dimensions for store mapping.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Grid Dimensions</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Set the number of grid cells for your layout
              </p>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="grid-width" className="text-xs">Grid Width</Label>
                    <Input
                      id="grid-width"
                      type="number"
                      min="5"
                      max="50"
                      step="1"
                      value={storeLayout.gridWidth}
                      onChange={(e) => {
                        const updated = {
                          ...storeLayout,
                          gridWidth: parseInt(e.target.value) || 20
                        };
                        setStoreLayout(updated);
                        saveToLocalStorage(updated);
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="grid-height" className="text-xs">Grid Height</Label>
                    <Input
                      id="grid-height"
                      type="number"
                      min="5"
                      max="50"
                      step="1"
                      value={storeLayout.gridHeight}
                      onChange={(e) => {
                        const updated = {
                          ...storeLayout,
                          gridHeight: parseInt(e.target.value) || 15
                        };
                        setStoreLayout(updated);
                        saveToLocalStorage(updated);
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label>Physical Dimensions</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Specify the real-world dimensions of your store layout
              </p>
              
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div className="col-span-2">
                    <Label htmlFor="layout-width" className="text-xs">Width</Label>
                    <Input
                      id="layout-width"
                      type="number"
                      min="1"
                      step="1"
                      value={storeLayout.layoutWidth || 20}
                      onChange={(e) => {
                        const updated = {
                          ...storeLayout,
                          layoutWidth: parseInt(e.target.value) || 20
                        };
                        setStoreLayout(updated);
                        saveToLocalStorage(updated);
                      }}
                      className="mt-1"
                    />
                  </div>
                  <Select 
                    value={storeLayout.layoutUnit || 'meters'}
                    onValueChange={(value: 'meters' | 'feet') => {
                      const updated = { ...storeLayout, layoutUnit: value };
                      setStoreLayout(updated);
                      saveToLocalStorage(updated);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meters">Meters</SelectItem>
                      <SelectItem value="feet">Feet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-2 items-end">
                  <div className="col-span-2">
                    <Label htmlFor="layout-height" className="text-xs">Height</Label>
                    <Input
                      id="layout-height"
                      type="number"
                      min="1"
                      step="1"
                      value={storeLayout.layoutHeight || 15}
                      onChange={(e) => {
                        const updated = {
                          ...storeLayout,
                          layoutHeight: parseInt(e.target.value) || 15
                        };
                        setStoreLayout(updated);
                        saveToLocalStorage(updated);
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground flex items-end pb-2">
                    {storeLayout.layoutUnit || 'meters'}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Grid: {storeLayout.gridWidth} × {storeLayout.gridHeight} cells</div>
                <div>Elements: {layout.length} total ({bays.length} bays)</div>
                <div>Scanned Products: {scannedProductCount}</div>
              </div>
            </div>

            <Button 
              onClick={() => setSettingsDialogOpen(false)}
              className="w-full"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
