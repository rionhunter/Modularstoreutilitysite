import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Box,
  Scan,
  Play,
  Pause,
  RotateCcw,
  Save,
  Download,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowDown,
  Maximize,
  Minimize,
  Settings
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Bay } from '../types/modules';

interface BayLocation {
  id: string;
  name: string;
  bayData: Bay;
}

interface ScannedProduct {
  barcode: string;
  bayId: string;
  bayName: string;
  shelf: number;
  column: number;
  tray?: number;
  drawer?: { row: number; col: number };
  timestamp: number;
  needsCleaning?: boolean;
}

type ControlCode = 'EMPTY' | 'END_SHELF' | 'END_BAY' | 'END_DRAWER_ROW' | 'UNDO' | 'RESTART_BAY' | 'RESTART_SHELF' | 'MARK_DIRTY';

const DEFAULT_CONTROL_BARCODES: Record<ControlCode, string> = {
  EMPTY: 'CTRL_EMPTY_SLOT',
  END_SHELF: 'CTRL_END_SHELF',
  END_BAY: 'CTRL_END_BAY',
  END_DRAWER_ROW: 'CTRL_END_DRAWER_ROW',
  UNDO: 'CTRL_UNDO',
  RESTART_BAY: 'CTRL_RESTART_BAY',
  RESTART_SHELF: 'CTRL_RESTART_SHELF',
  MARK_DIRTY: 'CTRL_MARK_DIRTY',
};

interface StockTakePageProps {
  onNavigate?: (view: 'layout') => void;
}

export function StockTakePage({ onNavigate }: StockTakePageProps = {}) {
  const [bays, setBays] = useState<BayLocation[]>([]);
  const [selectedBayIds, setSelectedBayIds] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>(() => {
    const saved = localStorage.getItem('stock-take-scanned-products');
    return saved ? JSON.parse(saved) : [];
  });
  const [flashAnimation, setFlashAnimation] = useState(false);
  const [controlBarcodes, setControlBarcodes] = useState<Record<ControlCode, string>>(() => {
    const saved = localStorage.getItem('custom-control-barcodes');
    return saved ? JSON.parse(saved) : DEFAULT_CONTROL_BARCODES;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempControlBarcodes, setTempControlBarcodes] = useState<Record<ControlCode, string>>(controlBarcodes);
  
  // Current position tracking
  const [currentBayIndex, setCurrentBayIndex] = useState(() => {
    const saved = localStorage.getItem('stock-take-position');
    return saved ? JSON.parse(saved).currentBayIndex : 0;
  });
  const [currentShelf, setCurrentShelf] = useState(() => {
    const saved = localStorage.getItem('stock-take-position');
    return saved ? JSON.parse(saved).currentShelf : 0;
  });
  const [currentColumn, setCurrentColumn] = useState(() => {
    const saved = localStorage.getItem('stock-take-position');
    return saved ? JSON.parse(saved).currentColumn : 0;
  });
  const [currentTray, setCurrentTray] = useState(() => {
    const saved = localStorage.getItem('stock-take-position');
    return saved ? JSON.parse(saved).currentTray : 0;
  });
  const [inTrayMode, setInTrayMode] = useState(() => {
    const saved = localStorage.getItem('stock-take-position');
    return saved ? JSON.parse(saved).inTrayMode : false;
  });
  const [inDrawerMode, setInDrawerMode] = useState(() => {
    const saved = localStorage.getItem('stock-take-position');
    return saved ? JSON.parse(saved).inDrawerMode : false;
  });
  const [currentDrawerRow, setCurrentDrawerRow] = useState(() => {
    const saved = localStorage.getItem('stock-take-position');
    return saved ? JSON.parse(saved).currentDrawerRow : 0;
  });
  const [currentDrawerCol, setCurrentDrawerCol] = useState(() => {
    const saved = localStorage.getItem('stock-take-position');
    return saved ? JSON.parse(saved).currentDrawerCol : 0;
  });
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedBays = Array.from(selectedBayIds)
    .map(id => bays.find(b => b.id === id))
    .filter(Boolean) as BayLocation[];

  // Load bays and selected bays
  useEffect(() => {
    const saved = localStorage.getItem('store-layout-locations');
    if (saved) {
      const locations = JSON.parse(saved);
      setBays(locations);
    }
    
    const savedSelection = localStorage.getItem('stock-take-selected-bays');
    if (savedSelection) {
      setSelectedBayIds(new Set(JSON.parse(savedSelection)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save scanned products whenever they change
  useEffect(() => {
    localStorage.setItem('stock-take-scanned-products', JSON.stringify(scannedProducts));
    // Dispatch event so other components can react
    window.dispatchEvent(new Event('stock-take-updated'));
  }, [scannedProducts]);

  // Save position whenever it changes
  useEffect(() => {
    const position = {
      currentBayIndex,
      currentShelf,
      currentColumn,
      currentTray,
      inTrayMode,
      inDrawerMode,
      currentDrawerRow,
      currentDrawerCol,
    };
    localStorage.setItem('stock-take-position', JSON.stringify(position));
  }, [currentBayIndex, currentShelf, currentColumn, currentTray, inTrayMode, inDrawerMode, currentDrawerRow, currentDrawerCol]);

  // Save selected bays whenever they change
  useEffect(() => {
    localStorage.setItem('stock-take-selected-bays', JSON.stringify(Array.from(selectedBayIds)));
  }, [selectedBayIds]);

  useEffect(() => {
    if (isScanning && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isScanning]);

  const toggleBaySelection = (bayId: string) => {
    const newSelected = new Set(selectedBayIds);
    if (newSelected.has(bayId)) {
      newSelected.delete(bayId);
    } else {
      newSelected.add(bayId);
    }
    setSelectedBayIds(newSelected);
  };

  const findNextActiveSlot = (
    bayIndex: number,
    shelf: number,
    column: number
  ): { bayIndex: number; shelf: number; column: number } | null => {
    if (bayIndex >= selectedBays.length) return null;

    const bay = selectedBays[bayIndex];
    if (!bay) return null;

    // Check current position
    if (shelf < bay.bayData.shelves && column < bay.bayData.columns) {
      const slot = bay.bayData.slots?.find(s => s.row === shelf && s.col === column);
      if (slot?.type !== 'inactive') {
        return { bayIndex, shelf, column };
      }
      
      // Current is inactive, check next column
      if (column < bay.bayData.columns - 1) {
        return findNextActiveSlot(bayIndex, shelf, column + 1);
      }
      // Move to next shelf
      if (shelf < bay.bayData.shelves - 1) {
        return findNextActiveSlot(bayIndex, shelf + 1, 0);
      }
      // Move to next bay
      return findNextActiveSlot(bayIndex + 1, 0, 0);
    }

    return null;
  };

  const startScanning = () => {
    if (selectedBays.length === 0) {
      toast.error('Please select at least one bay');
      return;
    }
    setIsScanning(true);
    
    // Only reset position if starting fresh (no scanned products)
    if (scannedProducts.length === 0) {
      // Find first active slot
      const firstActive = findNextActiveSlot(0, 0, 0);
      if (firstActive) {
        setCurrentBayIndex(firstActive.bayIndex);
        setCurrentShelf(firstActive.shelf);
        setCurrentColumn(firstActive.column);
        
        // Check if the first slot is a tray
        const firstBay = selectedBays[firstActive.bayIndex];
        if (firstBay?.bayData) {
          const firstSlot = firstBay.bayData.slots?.find(
            s => s.row === firstActive.shelf && s.col === firstActive.column
          );
          if (firstSlot?.type === 'tray') {
            setInTrayMode(true);
            setCurrentTray(0);
          } else {
            setInTrayMode(false);
            setCurrentTray(0);
          }
        }
      } else {
        setCurrentBayIndex(0);
        setCurrentShelf(0);
        setCurrentColumn(0);
        setCurrentTray(0);
        setInTrayMode(false);
      }
      toast.success('Stock take started. Scan products left to right, top to bottom.');
    } else {
      toast.success('Resuming stock take from saved position.');
    }
  };

  const pauseScanning = () => {
    setIsScanning(false);
    toast('Stock take paused');
  };

  const resetScanning = () => {
    if (scannedProducts.length > 0 && !confirm('This will clear all scanned data. Continue?')) {
      return;
    }
    setIsScanning(false);
    setScannedProducts([]);
    setCurrentBayIndex(0);
    setCurrentShelf(0);
    setCurrentColumn(0);
    setCurrentTray(0);
    setInTrayMode(false);
    setInDrawerMode(false);
    setCurrentDrawerRow(0);
    setCurrentDrawerCol(0);
    
    // Clear localStorage
    localStorage.removeItem('stock-take-scanned-products');
    localStorage.removeItem('stock-take-position');
    
    toast.success('Stock take reset');
  };

  const triggerFlash = (color: 'success' | 'warning' | 'error') => {
    setFlashAnimation(true);
    const root = document.documentElement;
    if (color === 'success') {
      root.style.setProperty('--flash-color', '34, 197, 94'); // green
    } else if (color === 'warning') {
      root.style.setProperty('--flash-color', '234, 179, 8'); // yellow
    } else {
      root.style.setProperty('--flash-color', '239, 68, 68'); // red
    }
    setTimeout(() => setFlashAnimation(false), 300);
  };

  const moveToNextPosition = () => {
    const moveAndCheckInactive = (
      newBayIndex: number,
      newShelf: number,
      newColumn: number,
      newTray: number,
      newInTrayMode: boolean
    ) => {
      // Check if we've completed all bays
      if (newBayIndex >= selectedBays.length) {
        setIsScanning(false);
        toast.success('Stock take completed!');
        return;
      }

      const bay = selectedBays[newBayIndex];
      if (!bay) return;

      // Check if we've exceeded bay bounds
      if (newShelf >= bay.bayData.shelves) {
        // Move to next bay
        moveAndCheckInactive(newBayIndex + 1, 0, 0, 0, false);
        return;
      }
      if (newColumn >= bay.bayData.columns) {
        // Move to next shelf
        moveAndCheckInactive(newBayIndex, newShelf + 1, 0, 0, false);
        return;
      }

      // Check if current slot is inactive
      const slot = bay.bayData.slots?.find(
        s => s.row === newShelf && s.col === newColumn
      );

      if (slot?.type === 'inactive') {
        // Skip this slot automatically and move to next
        toast('Auto-skipping inactive slot', { duration: 1000 });
        
        // Calculate next position
        if (newColumn < bay.bayData.columns - 1) {
          moveAndCheckInactive(newBayIndex, newShelf, newColumn + 1, 0, false);
        } else if (newShelf < bay.bayData.shelves - 1) {
          moveAndCheckInactive(newBayIndex, newShelf + 1, 0, 0, false);
        } else {
          moveAndCheckInactive(newBayIndex + 1, 0, 0, 0, false);
        }
        return;
      }

      // Check if new slot is a tray and enter tray mode
      const isNewSlotTray = slot?.type === 'tray' && slot.traySlots && slot.traySlots > 0;
      
      // Set the new position
      setCurrentBayIndex(newBayIndex);
      setCurrentShelf(newShelf);
      setCurrentColumn(newColumn);
      setCurrentTray(newTray);
      setInTrayMode(isNewSlotTray);
    };

    const currentBay = selectedBays[currentBayIndex];
    if (!currentBay) return;

    // If in tray mode, increment tray
    if (inTrayMode) {
      const slot = currentBay.bayData.slots?.find(
        s => s.row === currentShelf && s.col === currentColumn
      );
      if (slot && slot.type === 'tray' && slot.traySlots && currentTray < slot.traySlots - 1) {
        setCurrentTray(currentTray + 1);
        return;
      } else {
        // End of tray, exit tray mode and move to next column
        if (currentColumn < currentBay.bayData.columns - 1) {
          moveAndCheckInactive(currentBayIndex, currentShelf, currentColumn + 1, 0, false);
        } else if (currentShelf < currentBay.bayData.shelves - 1) {
          moveAndCheckInactive(currentBayIndex, currentShelf + 1, 0, 0, false);
        } else {
          moveAndCheckInactive(currentBayIndex + 1, 0, 0, 0, false);
        }
        return;
      }
    }

    // If in drawer mode, handle drawer navigation
    if (inDrawerMode) {
      const drawerCols = currentBay.bayData.drawerColumns || 0;
      const drawerRows = currentBay.bayData.drawerRows || 0;
      
      if (currentDrawerCol < drawerCols - 1) {
        setCurrentDrawerCol(currentDrawerCol + 1);
        return;
      } else if (currentDrawerRow < drawerRows - 1) {
        setCurrentDrawerCol(0);
        setCurrentDrawerRow(currentDrawerRow + 1);
        return;
      } else {
        // End of drawers, move to next bay
        setInDrawerMode(false);
        setCurrentDrawerRow(0);
        setCurrentDrawerCol(0);
        moveAndCheckInactive(currentBayIndex + 1, 0, 0, 0, false);
        return;
      }
    }

    // Move to next column
    if (currentColumn < currentBay.bayData.columns - 1) {
      moveAndCheckInactive(currentBayIndex, currentShelf, currentColumn + 1, 0, false);
    } else {
      // End of row, move to next shelf
      if (currentShelf < currentBay.bayData.shelves - 1) {
        moveAndCheckInactive(currentBayIndex, currentShelf + 1, 0, 0, false);
      } else {
        // End of shelves - check if bay has drawers
        if (currentBay.bayData.hasDrawers && currentBay.bayData.drawerRows && currentBay.bayData.drawerColumns) {
          setInDrawerMode(true);
          setCurrentDrawerRow(0);
          setCurrentDrawerCol(0);
          toast.success('Transitioning to drawer mode');
          return;
        } else {
          // No drawers, move to next bay
          moveAndCheckInactive(currentBayIndex + 1, 0, 0, 0, false);
        }
      }
    }
  };

  const handleControlCode = (code: ControlCode) => {
    const currentBay = selectedBays[currentBayIndex];
    if (!currentBay) return;

    switch (code) {
      case 'EMPTY':
        triggerFlash('warning');
        toast('Empty slot marked');
        moveToNextPosition();
        break;
      
      case 'END_SHELF':
        if (inDrawerMode) {
          triggerFlash('error');
          toast.error('Cannot use END_SHELF in drawer mode - use END_DRAWER_ROW instead');
          return;
        }
        triggerFlash('warning');
        setCurrentColumn(0);
        setInTrayMode(false);
        setCurrentTray(0);
        if (currentShelf < currentBay.bayData.shelves - 1) {
          toast('Moving to next shelf');
          setCurrentShelf(currentShelf + 1);
          // Check if first slot of new shelf is a tray
          const firstSlot = currentBay.bayData.slots?.find(s => s.row === currentShelf + 1 && s.col === 0);
          if (firstSlot?.type === 'tray' && firstSlot.traySlots) {
            setInTrayMode(true);
          }
        } else {
          // Last shelf - check if bay has drawers
          if (currentBay.bayData.hasDrawers && currentBay.bayData.drawerRows && currentBay.bayData.drawerColumns) {
            toast('Transitioning to drawer mode');
            setInDrawerMode(true);
            setCurrentDrawerRow(0);
            setCurrentDrawerCol(0);
          } else {
            toast.error('Already on last shelf');
          }
        }
        break;
      
      case 'END_BAY':
        triggerFlash('warning');
        // Check if current bay has drawers and we haven't started drawer mode yet
        if (currentBay.bayData.hasDrawers && !inDrawerMode && currentBay.bayData.drawerRows && currentBay.bayData.drawerColumns) {
          toast('Transitioning to drawer mode');
          setInDrawerMode(true);
          setCurrentDrawerRow(0);
          setCurrentDrawerCol(0);
        } else {
          toast('Moving to next bay');
          setCurrentShelf(0);
          setCurrentColumn(0);
          setInTrayMode(false);
          setCurrentTray(0);
          setInDrawerMode(false);
          setCurrentDrawerRow(0);
          setCurrentDrawerCol(0);
          if (currentBayIndex < selectedBays.length - 1) {
            setCurrentBayIndex(currentBayIndex + 1);
            // Check if first slot of new bay is a tray
            const nextBay = selectedBays[currentBayIndex + 1];
            const firstSlot = nextBay?.bayData.slots?.find(s => s.row === 0 && s.col === 0);
            if (firstSlot?.type === 'tray' && firstSlot.traySlots) {
              setInTrayMode(true);
            }
          } else {
            setIsScanning(false);
            toast.success('All bays completed!');
          }
        }
        break;
      
      case 'END_DRAWER_ROW':
        if (!inDrawerMode) {
          triggerFlash('error');
          toast.error('Not in drawer mode');
          return;
        }
        triggerFlash('warning');
        toast('Moving to next drawer row');
        const drawerRows = currentBay.bayData.drawerRows || 0;
        if (currentDrawerRow < drawerRows - 1) {
          setCurrentDrawerRow(currentDrawerRow + 1);
          setCurrentDrawerCol(0);
        } else {
          toast.error('Already on last drawer row');
        }
        break;
      
      case 'UNDO':
        if (scannedProducts.length === 0) {
          triggerFlash('error');
          toast.error('No products to undo');
          return;
        }
        const lastProduct = scannedProducts[scannedProducts.length - 1];
        setScannedProducts(prev => prev.slice(0, -1));
        
        // Move back to the position of the last scanned item
        const lastBayIndex = selectedBays.findIndex(b => b.id === lastProduct.bayId);
        if (lastBayIndex !== -1) {
          setCurrentBayIndex(lastBayIndex);
          if (lastProduct.drawer) {
            setInDrawerMode(true);
            setCurrentDrawerRow(lastProduct.drawer.row);
            setCurrentDrawerCol(lastProduct.drawer.col);
            setInTrayMode(false);
          } else {
            setInDrawerMode(false);
            setCurrentDrawerRow(0);
            setCurrentDrawerCol(0);
            setCurrentShelf(lastProduct.shelf);
            setCurrentColumn(lastProduct.column);
            if (lastProduct.tray !== undefined) {
              setInTrayMode(true);
              setCurrentTray(lastProduct.tray);
            } else {
              setInTrayMode(false);
              setCurrentTray(0);
            }
          }
        }
        
        triggerFlash('warning');
        toast.success('Last scan undone');
        break;
      
      case 'RESTART_BAY':
        triggerFlash('warning');
        setCurrentShelf(0);
        setCurrentColumn(0);
        setCurrentTray(0);
        setInDrawerMode(false);
        setCurrentDrawerRow(0);
        setCurrentDrawerCol(0);
        // Check if first slot is a tray
        const firstSlot = currentBay.bayData.slots?.find(s => s.row === 0 && s.col === 0);
        setInTrayMode(firstSlot?.type === 'tray' && !!firstSlot.traySlots);
        toast.success('Restarted current bay');
        break;
      
      case 'RESTART_SHELF':
        if (inDrawerMode) {
          triggerFlash('error');
          toast.error('Cannot restart shelf in drawer mode');
          return;
        }
        triggerFlash('warning');
        setCurrentColumn(0);
        setCurrentTray(0);
        // Check if first slot of current shelf is a tray
        const shelfFirstSlot = currentBay.bayData.slots?.find(s => s.row === currentShelf && s.col === 0);
        setInTrayMode(shelfFirstSlot?.type === 'tray' && !!shelfFirstSlot.traySlots);
        toast.success('Restarted current shelf');
        break;
      
      case 'MARK_DIRTY':
        if (scannedProducts.length === 0) {
          triggerFlash('error');
          toast.error('No products to mark as dirty');
          return;
        }
        
        // Mark last product as needing cleaning
        setScannedProducts(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            needsCleaning: true
          };
          return updated;
        });
        
        // Create or update cleaning task
        const dirtyItems = [...scannedProducts.filter(p => p.needsCleaning), scannedProducts[scannedProducts.length - 1]];
        const cleaningTask = {
          id: 'cleaning-task',
          title: `Clean ${dirtyItems.length} item(s)`,
          category: 'maintenance',
          createdAt: new Date(),
          completed: false,
          alertDays: 1,
          dirtyItems: dirtyItems.map(item => ({
            barcode: item.barcode,
            location: item.drawer 
              ? `${item.bayName} Drawer R${item.drawer.row + 1}C${item.drawer.col + 1}`
              : `${item.bayName} S${item.shelf + 1}C${item.column + 1}${item.tray !== undefined ? `T${item.tray + 1}` : ''}`
          }))
        };
        
        // Save to localStorage for TaskTracker to pick up
        const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const cleaningTaskIndex = existingTasks.findIndex((t: { id: string }) => t.id === 'cleaning-task');
        if (cleaningTaskIndex !== -1) {
          existingTasks[cleaningTaskIndex] = cleaningTask;
        } else {
          existingTasks.push(cleaningTask);
        }
        localStorage.setItem('tasks', JSON.stringify(existingTasks));
        window.dispatchEvent(new Event('tasks-updated'));
        
        triggerFlash('warning');
        toast.success('Item marked as needing cleaning');
        break;
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim() || !isScanning) return;

    const barcode = barcodeInput.trim().toUpperCase();
    const currentBay = selectedBays[currentBayIndex];
    
    if (!currentBay) {
      triggerFlash('error');
      toast.error('No current bay');
      setBarcodeInput('');
      return;
    }

    // Check for control codes
    const controlCode = Object.entries(controlBarcodes).find(
      ([_, value]) => value === barcode
    );

    if (controlCode) {
      handleControlCode(controlCode[0] as ControlCode);
      setBarcodeInput('');
      return;
    }

    // Check if current slot is a tray
    const currentSlot = currentBay.bayData.slots?.find(
      s => s.row === currentShelf && s.col === currentColumn
    );

    if (currentSlot?.type === 'inactive') {
      triggerFlash('error');
      toast.error('Current slot is inactive/obstructed');
      setBarcodeInput('');
      return;
    }

    // If slot is a tray and we're not in tray mode, enter tray mode.
    // Use a local variable so the product recorded below gets the correct tray info
    // even though the setInTrayMode state update is async.
    const enteringTrayMode = currentSlot?.type === 'tray' && !inTrayMode && !!currentSlot.traySlots;
    if (enteringTrayMode) {
      setInTrayMode(true);
      setCurrentTray(0);
    }

    const effectiveInTrayMode = inTrayMode || enteringTrayMode;
    const effectiveTray = enteringTrayMode ? 0 : currentTray;

    // Record the scanned product
    const scannedProduct: ScannedProduct = {
      barcode,
      bayId: currentBay.id,
      bayName: currentBay.name,
      shelf: currentShelf,
      column: currentColumn,
      tray: effectiveInTrayMode ? effectiveTray : undefined,
      drawer: inDrawerMode ? { row: currentDrawerRow, col: currentDrawerCol } : undefined,
      timestamp: Date.now(),
    };

    setScannedProducts(prev => [...prev, scannedProduct]);
    triggerFlash('success');
    
    // Show visual feedback
    const locationStr = inDrawerMode 
      ? `${currentBay.name} Drawer R${currentDrawerRow + 1}C${currentDrawerCol + 1}`
      : `${currentBay.name} S${currentShelf + 1}C${currentColumn + 1}${effectiveInTrayMode ? `T${effectiveTray + 1}` : ''}`;
    toast.success(`Scanned: ${barcode.substring(0, 20)} at ${locationStr}`);

    // Move to next position
    moveToNextPosition();
    setBarcodeInput('');
  };

  const saveStockTake = () => {
    const data = {
      timestamp: Date.now(),
      bays: selectedBays.map(b => ({ id: b.id, name: b.name })),
      products: scannedProducts,
    };
    localStorage.setItem('stock-take-data', JSON.stringify(data));
    toast.success('Stock take saved');
  };

  const exportStockTake = () => {
    const data = {
      timestamp: Date.now(),
      date: new Date().toISOString(),
      bays: selectedBays.map(b => ({ id: b.id, name: b.name })),
      products: scannedProducts,
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-take-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success('Stock take exported');
  };

  const saveControlBarcodes = () => {
    setControlBarcodes(tempControlBarcodes);
    localStorage.setItem('custom-control-barcodes', JSON.stringify(tempControlBarcodes));
    setSettingsOpen(false);
    toast.success('Control barcodes updated');
  };

  const resetControlBarcodes = () => {
    setTempControlBarcodes(DEFAULT_CONTROL_BARCODES);
    setControlBarcodes(DEFAULT_CONTROL_BARCODES);
    localStorage.removeItem('custom-control-barcodes');
    toast.success('Control barcodes reset to defaults');
  };

  const isCustomized = JSON.stringify(controlBarcodes) !== JSON.stringify(DEFAULT_CONTROL_BARCODES);

  const calculateBaySlotCount = (bay: BayLocation | undefined) => {
    if (!bay || !bay.bayData) return 0;
    let count = 0;
    for (let shelf = 0; shelf < bay.bayData.shelves; shelf++) {
      for (let col = 0; col < bay.bayData.columns; col++) {
        const slot = bay.bayData.slots?.find(s => s.row === shelf && s.col === col);
        if (slot?.type !== 'inactive') {
          if (slot?.type === 'tray' && slot.traySlots) {
            count += slot.traySlots;
          } else {
            count += 1;
          }
        }
      }
    }
    return count;
  };

  const calculateCurrentSlotNumber = () => {
    let count = 0;
    
    // Add all completed bays
    for (let i = 0; i < currentBayIndex; i++) {
      count += calculateBaySlotCount(selectedBays[i]);
    }
    
    // Add slots in current bay up to current position
    if (currentBay) {
      for (let shelf = 0; shelf < currentBay.bayData.shelves; shelf++) {
        for (let col = 0; col < currentBay.bayData.columns; col++) {
          if (shelf < currentShelf || (shelf === currentShelf && col < currentColumn)) {
            const slot = currentBay.bayData.slots?.find(s => s.row === shelf && s.col === col);
            if (slot?.type !== 'inactive') {
              if (slot?.type === 'tray' && slot.traySlots) {
                count += slot.traySlots;
              } else {
                count += 1;
              }
            }
          } else if (shelf === currentShelf && col === currentColumn) {
            // Current slot - add tray slots if applicable
            const slot = currentBay.bayData.slots?.find(s => s.row === shelf && s.col === col);
            if (slot?.type === 'tray' && inTrayMode) {
              count += currentTray + 1;
            } else if (slot?.type !== 'inactive') {
              count += 1;
            }
          }
        }
      }
    }
    
    return count;
  };

  const currentBay = selectedBays[currentBayIndex];
  const totalSlots = selectedBays.reduce((sum, bay) => sum + calculateBaySlotCount(bay), 0);
  const currentSlotNumber = calculateCurrentSlotNumber();
  const progress = totalSlots > 0 ? (currentSlotNumber / totalSlots) * 100 : 0;

  return (
    <div className="space-y-6 relative">
      {/* Flash Animation Overlay */}
      {flashAnimation && (
        <div 
          className="fixed inset-0 z-50 pointer-events-none animate-pulse"
          style={{
            backgroundColor: 'rgba(var(--flash-color), 0.3)',
            animation: 'flash 0.3s ease-out'
          }}
        />
      )}

      <style>{`
        @keyframes flash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      {!isScanning ? (
        /* Bay Selection View */
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Select Bays for Stock Take
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose one or more bays to scan in sequence
              </p>
              {/* Debug info */}
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                <div>Total bays loaded: {bays.length}</div>
                <div>Selected bay IDs: {selectedBayIds.size}</div>
                <div>Computed selected bays: {selectedBays.length}</div>
              </div>
            </div>
            {selectedBays.length > 0 && (
              <div className="flex gap-2">
                <Button onClick={startScanning} size="lg">
                  <Play className="h-5 w-5 mr-2" />
                  {scannedProducts.length > 0 ? 'Resume' : 'Start'} Scanning ({selectedBays.length} bay{selectedBays.length > 1 ? 's' : ''})
                </Button>
                {scannedProducts.length > 0 && (
                  <Button 
                    onClick={() => {
                      if (!confirm('This will clear all scanned data and start fresh. Continue?')) {
                        return;
                      }
                      setScannedProducts([]);
                      setCurrentBayIndex(0);
                      setCurrentShelf(0);
                      setCurrentColumn(0);
                      setCurrentTray(0);
                      setInTrayMode(false);
                      setInDrawerMode(false);
                      setCurrentDrawerRow(0);
                      setCurrentDrawerCol(0);
                      localStorage.removeItem('stock-take-scanned-products');
                      localStorage.removeItem('stock-take-position');
                      toast.success('Ready to start new scan');
                      // Start scanning in next tick after state has updated
                      setTimeout(() => {
                        startScanning();
                      }, 0);
                    }}
                    variant="outline"
                    size="lg"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Start New Scan
                  </Button>
                )}
              </div>
            )}
          </div>

          {scannedProducts.length > 0 && (
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="py-3">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <span>Previous session found: {scannedProducts.length} products scanned. Click Resume to continue or Reset to start fresh.</span>
                </div>
              </CardContent>
            </Card>
          )}

          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {bays.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p>No bays configured. Create bays in the Store Layout page first.</p>
                    {onNavigate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => onNavigate('layout')}
                      >
                        Go to Store Layout
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                bays.map((bay) => (
                  <Card 
                    key={bay.id}
                    className={`cursor-pointer transition-all ${
                      selectedBayIds.has(bay.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => toggleBaySelection(bay.id)}
                  >
                    <CardHeader className="py-3">
                      <div className="flex items-center gap-3">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedBayIds.has(bay.id)}
                            onCheckedChange={() => toggleBaySelection(bay.id)}
                          />
                        </div>
                        <Box className="h-4 w-4" />
                        <div className="flex-1">
                          <CardTitle className="text-base">{bay.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {bay.bayData.shelves} shelves × {bay.bayData.columns} columns
                            {bay.bayData.hasDrawers && ' • Has drawers'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {bay.bayData.shelves * bay.bayData.columns} slots
                          </Badge>
                          {bay.bayData.slots?.some(s => s.type === 'tray') && (
                            <Badge variant="secondary">
                              {bay.bayData.slots.filter(s => s.type === 'tray').length} trays
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Control Barcode Reference */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Control Barcodes Reference</CardTitle>
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setTempControlBarcodes(controlBarcodes)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Customize
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Customize Control Barcodes</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground">
                        Set custom barcodes for control actions. Use any spare barcodes you have available.
                      </p>
                      {Object.entries(tempControlBarcodes).map(([key, value]) => (
                        <div key={key}>
                          <Label htmlFor={`ctrl-${key}`}>
                            {key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                          </Label>
                          <Input
                            id={`ctrl-${key}`}
                            value={value}
                            onChange={e => setTempControlBarcodes(prev => ({ ...prev, [key]: e.target.value.toUpperCase() }))}
                            className="mt-1 font-mono"
                            placeholder="Enter barcode"
                          />
                        </div>
                      ))}
                      <div className="flex gap-3 pt-4">
                        <Button onClick={saveControlBarcodes} className="flex-1">
                          Save Changes
                        </Button>
                        {isCustomized && (
                          <Button onClick={resetControlBarcodes} variant="outline">
                            Reset to Defaults
                          </Button>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>Empty Slot:</span>
                  <Badge variant="outline">{controlBarcodes.EMPTY}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>End of Shelf:</span>
                  <Badge variant="outline">{controlBarcodes.END_SHELF}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>End of Bay:</span>
                  <Badge variant="outline">{controlBarcodes.END_BAY}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>End Drawer Row:</span>
                  <Badge variant="outline">{controlBarcodes.END_DRAWER_ROW}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>Undo Last Scan:</span>
                  <Badge variant="outline">{controlBarcodes.UNDO}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>Restart Bay:</span>
                  <Badge variant="outline">{controlBarcodes.RESTART_BAY}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>Restart Shelf:</span>
                  <Badge variant="outline">{controlBarcodes.RESTART_SHELF}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>Mark as Dirty:</span>
                  <Badge variant="outline">{controlBarcodes.MARK_DIRTY}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Scanning View */
        <div className={`${isFullScreen ? 'fixed inset-0 z-50 bg-background p-6 overflow-auto' : ''} space-y-6`}>
          {/* Large Status Display */}
          <Card className="bg-primary/5">
            <CardContent className="py-12">
              <div className="text-center space-y-8">
                {/* Bay Name */}
                <div className="flex items-center justify-center gap-4">
                  <Scan className="h-16 w-16 text-primary animate-pulse" />
                  <h2 className="text-5xl">
                    {currentBay?.name || 'Unknown Bay'}
                  </h2>
                </div>

                {/* Dominant Shelf and Column Numbers */}
                <div className="flex items-center justify-center gap-12">
                  {inDrawerMode ? (
                    <>
                      <div className="flex flex-col items-center">
                        <span className="text-lg text-muted-foreground mb-2">DRAWER ROW</span>
                        <div className="text-9xl tabular-nums tracking-tight">
                          {currentDrawerRow + 1}
                        </div>
                      </div>
                      <ArrowRight className="h-24 w-24 text-muted-foreground" />
                      <div className="flex flex-col items-center">
                        <span className="text-lg text-muted-foreground mb-2">DRAWER COL</span>
                        <div className="text-9xl tabular-nums tracking-tight">
                          {currentDrawerCol + 1}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col items-center">
                        <span className="text-lg text-muted-foreground mb-2">SHELF</span>
                        <div className="text-9xl tabular-nums tracking-tight">
                          {currentShelf + 1}
                        </div>
                      </div>
                      <ArrowRight className="h-24 w-24 text-muted-foreground" />
                      <div className="flex flex-col items-center">
                        <span className="text-lg text-muted-foreground mb-2">COLUMN</span>
                        <div className="text-9xl tabular-nums tracking-tight">
                          {currentColumn + 1}
                        </div>
                      </div>
                      {inTrayMode && (
                        <>
                          <ArrowDown className="h-24 w-24 text-muted-foreground" />
                          <div className="flex flex-col items-center">
                            <span className="text-lg text-muted-foreground mb-2">TRAY SLOT</span>
                            <div className="text-9xl tabular-nums tracking-tight">
                              {currentTray + 1}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Progress Bars */}
                <div className="space-y-6 max-w-4xl mx-auto">
                  {/* Tray Progress (only shown when in tray mode) */}
                  {inTrayMode && currentBay && (() => {
                    const slot = currentBay.bayData.slots?.find(
                      s => s.row === currentShelf && s.col === currentColumn
                    );
                    const traySlots = slot?.traySlots || 1;
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-base">
                          <span className="text-muted-foreground">Current Tray Progress</span>
                          <span className="tabular-nums">
                            {currentTray + 1} / {traySlots} slots
                          </span>
                        </div>
                        <div className="h-6 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 transition-all duration-300"
                            style={{ 
                              width: `${((currentTray + 1) / traySlots * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Shelf Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-base">
                      <span className="text-muted-foreground">Current Shelf Progress</span>
                      <span className="tabular-nums">
                        {currentColumn + 1} / {currentBay?.bayData.columns || 0} columns
                      </span>
                    </div>
                    <div className="h-6 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ 
                          width: `${currentBay ? ((currentColumn + 1) / currentBay.bayData.columns * 100) : 0}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Bay Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-base">
                      <span className="text-muted-foreground">Current Bay Progress</span>
                      <span className="tabular-nums">
                        {currentBay ? (currentShelf * currentBay.bayData.columns + currentColumn + 1) : 0} / {currentBay ? (currentBay.bayData.shelves * currentBay.bayData.columns) : 0} slots
                      </span>
                    </div>
                    <div className="h-6 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ 
                          width: `${currentBay ? ((currentShelf * currentBay.bayData.columns + currentColumn + 1) / (currentBay.bayData.shelves * currentBay.bayData.columns) * 100) : 0}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Overall Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-base">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="tabular-nums">
                        Bay {currentBayIndex + 1} of {selectedBays.length} • Slot {currentSlotNumber} of {totalSlots}
                      </span>
                    </div>
                    <div className="h-6 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Badge variant="outline" className="text-sm">
                      <Save className="h-3 w-3 mr-1" />
                      Auto-saving
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Barcode Input */}
          <Card>
            <CardContent className="py-6">
              <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="barcode" className="text-lg">Scan Barcode</Label>
                  <Input
                    ref={inputRef}
                    id="barcode"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Place cursor here and scan..."
                    className="mt-2 text-2xl h-16 text-center"
                    autoFocus
                    autoComplete="off"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" size="lg">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Confirm Scan
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={pauseScanning}
                    size="lg"
                  >
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    size="lg"
                  >
                    {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Current Slot Info */}
          {!isFullScreen && currentBay && (() => {
            const slot = currentBay.bayData.slots?.find(
              s => s.row === currentShelf && s.col === currentColumn
            );
            return slot && (
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Current Slot Type:</span>
                    </div>
                    <Badge 
                      variant={
                        slot.type === 'inactive' ? 'destructive' :
                        slot.type === 'tray' ? 'default' : 'secondary'
                      }
                    >
                      {slot.type === 'tray' 
                        ? `Tray (${slot.traySlots} sub-slots)` 
                        : slot.type
                      }
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Stats */}
          {!isFullScreen && (<div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="py-4 text-center">
                <div className="text-3xl">{scannedProducts.length}</div>
                <div className="text-sm text-muted-foreground">Products Scanned</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <div className="text-3xl">
                  {scannedProducts.filter(p => !p.tray).length}
                </div>
                <div className="text-sm text-muted-foreground">Regular Slots</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <div className="text-3xl">
                  {scannedProducts.filter(p => p.tray !== undefined).length}
                </div>
                <div className="text-sm text-muted-foreground">Tray Slots</div>
              </CardContent>
            </Card>
          </div>)}

          {/* Actions */}
          {!isFullScreen && (<div className="flex gap-2">
            <Button onClick={saveStockTake} variant="outline" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Progress
            </Button>
            <Button onClick={exportStockTake} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button onClick={resetScanning} variant="destructive">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>)}

          {/* Recent Scans */}
          {!isFullScreen && scannedProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Scans</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {scannedProducts.slice(-10).reverse().map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                        <span className="font-mono">{product.barcode}</span>
                        <Badge variant="outline">
                          {product.bayName} S{product.shelf + 1}C{product.column + 1}
                          {product.tray !== undefined && `T${product.tray + 1}`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}