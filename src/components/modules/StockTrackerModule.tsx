import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Package, Plus, Trash2, Search, MapPin, LayoutGrid, Scan } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface StockItem {
  id: string;
  name: string;
  sku: string;
  omaCode: string;
  location: string;
  bayId?: string;
  shelf?: string;
  column?: string;
  tray?: string;
  quantity: number;
}

interface BaySlot {
  row: number;
  col: number;
  type: 'single' | 'tray' | 'inactive';
  traySlots?: number;
}

interface BayLocation {
  id: string;
  name: string;
  bayData: {
    shelves: number;
    columns: number;
    slots: BaySlot[];
    hasDrawers: boolean;
    drawerRows?: number;
    drawerColumns?: number;
  };
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
}

export function StockTrackerModule() {
  const [items, setItems] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('stock-tracker-items');
    return saved ? JSON.parse(saved) : [];
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bayLocations, setBayLocations] = useState<BayLocation[]>([]);
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([]);
  
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newOmaCode, setNewOmaCode] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newBayId, setNewBayId] = useState('');
  const [newShelf, setNewShelf] = useState('');
  const [newColumn, setNewColumn] = useState('');
  const [newTray, setNewTray] = useState('');
  const [newQuantity, setNewQuantity] = useState('1');
  const [useLayoutLocation, setUseLayoutLocation] = useState(false);

  // Save items whenever they change
  useEffect(() => {
    localStorage.setItem('stock-tracker-items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    // Load bay locations from store layout
    const loadBayLocations = () => {
      const saved = localStorage.getItem('store-layout-locations');
      if (saved) {
        setBayLocations(JSON.parse(saved));
      }
    };

    // Load scanned products from stock take
    const loadScannedProducts = () => {
      const saved = localStorage.getItem('stock-take-scanned-products');
      if (saved) {
        setScannedProducts(JSON.parse(saved));
      }
    };

    loadBayLocations();
    loadScannedProducts();
    
    // Listen for layout and stock take changes
    const handleStorageChange = () => {
      loadBayLocations();
      loadScannedProducts();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when stock take updates
    const handleStockTakeUpdate = () => {
      loadScannedProducts();
    };
    
    window.addEventListener('stock-take-updated', handleStockTakeUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('stock-take-updated', handleStockTakeUpdate);
    };
  }, []);

  const addItem = (continueAdding: boolean = false) => {
    if (!newName.trim()) {
      toast.error('Please enter item name');
      return;
    }

    let locationString = newLocation;
    
    if (useLayoutLocation && newBayId) {
      const bay = bayLocations.find(b => b.id === newBayId);
      if (bay) {
        locationString = `${bay.name}`;
        if (newShelf) locationString += ` - S${newShelf}`;
        if (newColumn) locationString += `C${newColumn}`;
        if (newTray) locationString += `T${newTray}`;
      }
    }

    if (!locationString.trim() && !useLayoutLocation) {
      // Location is now optional when not using layout location
      locationString = 'Unspecified';
    }

    const newItem: StockItem = {
      id: Date.now().toString(),
      name: newName,
      sku: newSku,
      omaCode: newOmaCode,
      location: locationString,
      bayId: useLayoutLocation ? newBayId : undefined,
      shelf: useLayoutLocation ? newShelf : undefined,
      column: useLayoutLocation ? newColumn : undefined,
      tray: useLayoutLocation ? newTray : undefined,
      quantity: parseInt(newQuantity) || 1,
    };

    setItems(prev => [...prev, newItem]);
    
    if (continueAdding) {
      // Reset only the item-specific fields, keep location settings
      setNewName('');
      setNewSku('');
      setNewOmaCode('');
      setNewQuantity('1');
      toast.success('Stock item added. Add another?');
    } else {
      resetForm();
      setDialogOpen(false);
      toast.success('Stock item added');
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewSku('');
    setNewOmaCode('');
    setNewLocation('');
    setNewBayId('');
    setNewShelf('');
    setNewColumn('');
    setNewTray('');
    setNewQuantity('1');
    setUseLayoutLocation(false);
  };

  const deleteItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item removed');
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
    );
  };

  // Search through both stock items and scanned products
  const filteredItems = items.filter(
    item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.omaCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Search scanned products by barcode
  const matchingScans = scannedProducts.filter(scan =>
    scan.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const barcodeLocationMap = new Map<string, ScannedProduct[]>();
  matchingScans.forEach(scan => {
    const existing = barcodeLocationMap.get(scan.barcode) || [];
    barcodeLocationMap.set(scan.barcode, [...existing, scan]);
  });

  const locations = Array.from(new Set(items.map(item => item.location)));
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = items.filter(item => item.quantity < 10).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Location Tracker
            </CardTitle>
            <CardDescription>Track inventory across locations</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Stock Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="item-name">Item Name *</Label>
                  <Input
                    id="item-name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Product name"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="item-sku">SKU Code</Label>
                    <Input
                      id="item-sku"
                      value={newSku}
                      onChange={e => setNewSku(e.target.value)}
                      placeholder="Optional SKU"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="item-oma">OMA Code</Label>
                    <Input
                      id="item-oma"
                      value={newOmaCode}
                      onChange={e => setNewOmaCode(e.target.value)}
                      placeholder="Barcode"
                      className="mt-1"
                    />
                  </div>
                </div>

                {bayLocations.length > 0 && (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      <Label htmlFor="use-layout">Use Store Layout</Label>
                    </div>
                    <Button
                      variant={useLayoutLocation ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUseLayoutLocation(!useLayoutLocation)}
                    >
                      {useLayoutLocation ? 'On' : 'Off'}
                    </Button>
                  </div>
                )}

                {useLayoutLocation && bayLocations.length > 0 ? (
                  <>
                    <div>
                      <Label htmlFor="bay-select">Bay *</Label>
                      <Select value={newBayId} onValueChange={setNewBayId}>
                        <SelectTrigger id="bay-select" className="mt-1">
                          <SelectValue placeholder="Select bay" />
                        </SelectTrigger>
                        <SelectContent>
                          {bayLocations.map(bay => (
                            <SelectItem key={bay.id} value={bay.id}>
                              {bay.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {newBayId && (() => {
                      const selectedBay = bayLocations.find(b => b.id === newBayId);
                      if (!selectedBay) return null;

                      // Safety check for slots
                      if (!selectedBay.bayData.slots) {
                        return (
                          <div className="text-sm text-muted-foreground p-2 border rounded">
                            This bay needs to be reconfigured in the Store Layout page.
                          </div>
                        );
                      }

                      return (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="shelf-select">Shelf (Row)</Label>
                              <Select value={newShelf} onValueChange={setNewShelf}>
                                <SelectTrigger id="shelf-select" className="mt-1">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: selectedBay.bayData.shelves }, (_, i) => (
                                    <SelectItem key={i + 1} value={String(i + 1)}>
                                      Shelf {i + 1}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="column-select">Column</Label>
                              <Select value={newColumn} onValueChange={setNewColumn}>
                                <SelectTrigger id="column-select" className="mt-1">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: selectedBay.bayData.columns }, (_, i) => (
                                    <SelectItem key={i + 1} value={String(i + 1)}>
                                      Col {i + 1}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {newShelf && newColumn && (() => {
                            const slotRow = parseInt(newShelf) - 1;
                            const slotCol = parseInt(newColumn) - 1;
                            const slot = selectedBay.bayData.slots?.find(
                              s => s.row === slotRow && s.col === slotCol
                            );

                            if (slot?.type === 'tray' && slot.traySlots) {
                              return (
                                <div>
                                  <Label htmlFor="tray-select">Tray Slot</Label>
                                  <Select value={newTray} onValueChange={setNewTray}>
                                    <SelectTrigger id="tray-select" className="mt-1">
                                      <SelectValue placeholder="Select tray" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: slot.traySlots }, (_, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1)}>
                                          Tray {i + 1}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            }

                            if (slot?.type === 'inactive') {
                              return (
                                <div className="text-sm text-destructive p-2 border border-destructive rounded">
                                  This slot is marked as inactive/obstructed
                                </div>
                              );
                            }

                            return null;
                          })()}
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <div>
                    <Label htmlFor="item-location">Location (Optional)</Label>
                    <Input
                      id="item-location"
                      value={newLocation}
                      onChange={e => setNewLocation(e.target.value)}
                      placeholder="Aisle 3, Shelf B"
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="item-quantity">Quantity</Label>
                  <Input
                    id="item-quantity"
                    type="number"
                    value={newQuantity}
                    onChange={e => setNewQuantity(e.target.value)}
                    min="0"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => addItem(false)} className="w-full">
                    Add to Inventory
                  </Button>
                  <Button onClick={() => addItem(true)} variant="outline" className="w-full">
                    Add Another
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total Items:</span>
            <Badge variant="secondary">{totalItems}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Locations:</span>
            <Badge variant="secondary">{locations.length}</Badge>
          </div>
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Low Stock:</span>
              <Badge variant="destructive">{lowStockCount}</Badge>
            </div>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, or location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Scanned Barcode Results */}
        {searchQuery && barcodeLocationMap.size > 0 && (
          <div className="p-3 border rounded-lg bg-blue-500/5 border-blue-500/20 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Scan className="h-4 w-4 text-blue-500" />
              <span>Scanned Barcodes Found</span>
              <Badge variant="secondary">{barcodeLocationMap.size}</Badge>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {Array.from(barcodeLocationMap.entries()).map(([barcode, scans]) => (
                <div key={barcode} className="p-2 bg-background border rounded text-sm space-y-1">
                  <div className="font-mono break-all">{barcode}</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {scans.map((scan, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {scan.drawer 
                          ? `${scan.bayName} - Drawer R${scan.drawer.row + 1}C${scan.drawer.col + 1}`
                          : `${scan.bayName} - S${scan.shelf + 1}C${scan.column + 1}${scan.tray !== undefined ? `T${scan.tray + 1}` : ''}`
                        }
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredItems.length === 0 && (!searchQuery || barcodeLocationMap.size === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              {items.length === 0
                ? 'No stock items yet. Add one to get started.'
                : 'No items match your search.'}
            </div>
          ) : filteredItems.length === 0 && searchQuery && barcodeLocationMap.size > 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No stock items match. Showing scanned barcodes above.
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.quantity < 10 && (
                        <Badge variant="destructive" className="text-xs">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                    {(item.sku || item.omaCode) && (
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        {item.sku && <div>SKU: {item.sku}</div>}
                        {item.omaCode && <div>OMA: {item.omaCode}</div>}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      -
                    </Button>
                    <span className="font-mono min-w-[40px] text-center">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
