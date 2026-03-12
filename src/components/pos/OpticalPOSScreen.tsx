import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  User, 
  Eye, 
  Glasses,
  DollarSign,
  Zap,
  ChevronUp,
  ChevronDown,
  Package,
  Save,
  Printer,
  Plus,
  Minus,
  X,
  Check,
  Bluetooth,
  Keyboard,
  ArrowLeft,
  Star,
  Info
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { PackageDeal, DEFAULT_PACKAGES } from '../../types/packages';
import { OpticalSale, OpticalPrescription, OpticalFrame, LensSpecification, PatientInfo } from '../../types/sales';

interface ComparativeQuote {
  id: string;
  name: string;
  packageDeal?: PackageDeal;
  customizations: {
    additionalCoatings: string[];
    tintUpgrade: boolean;
    rushProcessing: boolean;
  };
  totalPrice: number;
}

export function OpticalPOSScreen({ onExit }: { onExit: () => void }) {
  // Core state
  const [packages, setPackages] = useState<PackageDeal[]>(() => {
    const saved = localStorage.getItem('optical-packages');
    return saved ? JSON.parse(saved) : DEFAULT_PACKAGES;
  });
  
  const [selectedPackage, setSelectedPackage] = useState<PackageDeal | null>(
    packages.find(p => p.active) || null
  );
  
  // Customer & RX
  const [customer, setCustomer] = useState<PatientInfo>({
    id: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    email: '',
  });

  const [rx, setRx] = useState<OpticalPrescription>({
    rightEye: { sphere: '', cylinder: '', axis: '', add: '' },
    leftEye: { sphere: '', cylinder: '', axis: '', add: '' },
    pd: { right: '', left: '', binocular: '63' },
  });

  // Frame
  const [frame, setFrame] = useState<OpticalFrame>({
    id: '',
    brand: '',
    model: '',
    color: '',
    size: '',
    price: 0,
    sku: '',
  });

  // Customizations
  const [additionalCoatings, setAdditionalCoatings] = useState<string[]>([]);
  const [tintUpgrade, setTintUpgrade] = useState(false);
  const [rushProcessing, setRushProcessing] = useState(false);

  // Comparative quotes
  const [quotes, setQuotes] = useState<ComparativeQuote[]>([]);
  const [activeQuoteId, setActiveQuoteId] = useState<string>('');

  // UI state
  const [focusedInput, setFocusedInput] = useState<string>('');
  const [measurementDevice, setMeasurementDevice] = useState<'manual' | 'device'>('manual');
  const [showPackageDetails, setShowPackageDetails] = useState(false);

  const activePackages = packages.filter(p => p.active).sort((a, b) => {
    const tierOrder = { basic: 0, standard: 1, premium: 2, ultimate: 3 };
    return tierOrder[a.tier] - tierOrder[b.tier];
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Number to switch packages
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (activePackages[index]) {
          selectPackage(activePackages[index]);
        }
      }
      
      // Alt + Up/Down to step between packages
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        stepPackage(e.key === 'ArrowUp' ? 'up' : 'down');
      }

      // Ctrl + Q for new quote comparison
      if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
        e.preventDefault();
        addComparativeQuote();
      }

      // Ctrl + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Escape to exit
      if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [selectedPackage, activePackages]);

  const selectPackage = (pkg: PackageDeal) => {
    setSelectedPackage(pkg);
    
    // Auto-apply package features
    setAdditionalCoatings([]);
    setTintUpgrade(false);
    setRushProcessing(pkg.includes.rushProcessing);
    
    toast.success(`${pkg.name} package selected`);
  };

  const stepPackage = (direction: 'up' | 'down') => {
    if (!selectedPackage) {
      if (activePackages.length > 0) {
        selectPackage(activePackages[0]);
      }
      return;
    }

    const currentIndex = activePackages.findIndex(p => p.id === selectedPackage.id);
    const newIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex >= 0 && newIndex < activePackages.length) {
      selectPackage(activePackages[newIndex]);
    }
  };

  const calculatePrice = (pkg: PackageDeal | null = selectedPackage): number => {
    if (!pkg) return frame.price;

    let total = pkg.price;
    
    // Frame excess
    if (pkg.frameMaxValue && frame.price > pkg.frameMaxValue) {
      total += (frame.price - pkg.frameMaxValue);
    }

    // Additional coatings not in package
    const extraCoatings = additionalCoatings.filter(
      c => !pkg.includes.coatings.includes(c)
    );
    total += extraCoatings.length * 35;

    // Tint upgrade
    if (tintUpgrade && !pkg.includes.tintIncluded) {
      total += 45;
    }

    // Rush processing
    if (rushProcessing && !pkg.includes.rushProcessing) {
      total += 75;
    }

    return total;
  };

  const addComparativeQuote = () => {
    if (!selectedPackage) {
      toast.error('Select a package first');
      return;
    }

    const newQuote: ComparativeQuote = {
      id: Date.now().toString(),
      name: `Quote ${quotes.length + 1}`,
      packageDeal: selectedPackage,
      customizations: {
        additionalCoatings: [...additionalCoatings],
        tintUpgrade,
        rushProcessing,
      },
      totalPrice: calculatePrice(),
    };

    setQuotes([...quotes, newQuote]);
    setActiveQuoteId(newQuote.id);
    toast.success('Quote added for comparison');
  };

  const removeQuote = (id: string) => {
    setQuotes(quotes.filter(q => q.id !== id));
    if (activeQuoteId === id && quotes.length > 1) {
      const remaining = quotes.filter(q => q.id !== id);
      setActiveQuoteId(remaining[0]?.id || '');
    }
  };

  const loadQuote = (quote: ComparativeQuote) => {
    if (quote.packageDeal) {
      setSelectedPackage(quote.packageDeal);
    }
    setAdditionalCoatings(quote.customizations.additionalCoatings);
    setTintUpgrade(quote.customizations.tintUpgrade);
    setRushProcessing(quote.customizations.rushProcessing);
    setActiveQuoteId(quote.id);
    toast.info(`Loaded ${quote.name}`);
  };

  const handleSave = () => {
    if (!customer.firstName || !customer.lastName || !customer.phone) {
      toast.error('Complete customer information');
      return;
    }

    if (!selectedPackage) {
      toast.error('Select a package');
      return;
    }

    if (!frame.brand || frame.price === 0) {
      toast.error('Enter frame details');
      return;
    }

    const sale: OpticalSale = {
      id: Date.now().toString(),
      saleNumber: `OPT-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      patient: customer,
      prescription: rx,
      frame,
      lenses: {
        type: selectedPackage.includes.lensType,
        material: selectedPackage.includes.material,
        index: selectedPackage.includes.index,
        coating: [...selectedPackage.includes.coatings, ...additionalCoatings],
        tint: tintUpgrade ? { type: 'solid', color: 'grey', density: '20%' } : undefined,
        price: selectedPackage.price,
      },
      framePrice: frame.price,
      lensPrice: selectedPackage.price,
      coatingPrice: additionalCoatings.length * 35,
      tintPrice: tintUpgrade ? 45 : 0,
      additionalItemsTotal: 0,
      subtotal: calculatePrice(),
      tax: calculatePrice() * 0.1,
      healthFundRebate: 0,
      total: calculatePrice() * 1.1,
      paymentStatus: 'pending',
      amountPaid: 0,
      status: 'pending',
    };

    const savedSales = localStorage.getItem('optical-sales');
    const sales = savedSales ? JSON.parse(savedSales) : [];
    sales.push(sale);
    localStorage.setItem('optical-sales', JSON.stringify(sales));

    toast.success('Sale saved successfully');
    
    // Reset for next sale
    setTimeout(() => {
      resetForm();
    }, 500);
  };

  const resetForm = () => {
    setCustomer({
      id: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phone: '',
      email: '',
    });
    setRx({
      rightEye: { sphere: '', cylinder: '', axis: '', add: '' },
      leftEye: { sphere: '', cylinder: '', axis: '', add: '' },
      pd: { right: '', left: '', binocular: '63' },
    });
    setFrame({
      id: '',
      brand: '',
      model: '',
      color: '',
      size: '',
      price: 0,
      sku: '',
    });
    setAdditionalCoatings([]);
    setTintUpgrade(false);
    setRushProcessing(false);
    setQuotes([]);
    setActiveQuoteId('');
  };

  const simulateDeviceSync = () => {
    // Simulate reading from digital PD meter or lensometer
    toast.info('Syncing measurements from device...');
    setTimeout(() => {
      setRx({
        ...rx,
        rightEye: { sphere: '-2.50', cylinder: '-0.75', axis: '180', add: '' },
        leftEye: { sphere: '-2.75', cylinder: '-0.50', axis: '175', add: '' },
        pd: { right: '31.5', left: '31.5', binocular: '63' },
      });
      toast.success('Measurements synced successfully');
    }, 1000);
  };

  const tierColors = {
    basic: 'from-slate-500 to-slate-600',
    standard: 'from-blue-500 to-blue-600',
    premium: 'from-purple-500 to-purple-600',
    ultimate: 'from-yellow-500 to-yellow-600',
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 border-b bg-muted/30 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onExit}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit POS
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Glasses className="h-5 w-5 text-primary" />
            <span className="font-medium">Optical Point of Sale</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Keyboard className="h-3 w-3" />
            Shortcuts Active
          </Badge>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save (Ctrl+S)
          </Button>
          <Button variant="default" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Left Panel - Customer & RX */}
        <div className="w-[400px] border-r bg-muted/20 flex flex-col">
          <Tabs defaultValue="customer" className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
              <TabsTrigger value="customer">
                <User className="h-4 w-4 mr-2" />
                Customer
              </TabsTrigger>
              <TabsTrigger value="rx">
                <Eye className="h-4 w-4 mr-2" />
                Prescription
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="customer" className="p-4 space-y-3 mt-0">
                <div>
                  <Label className="text-xs">First Name *</Label>
                  <Input
                    value={customer.firstName}
                    onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })}
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-xs">Last Name *</Label>
                  <Input
                    value={customer.lastName}
                    onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone *</Label>
                  <Input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Date of Birth</Label>
                  <Input
                    type="date"
                    value={customer.dateOfBirth}
                    onChange={(e) => setCustomer({ ...customer, dateOfBirth: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </TabsContent>

              <TabsContent value="rx" className="p-4 space-y-4 mt-0">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-medium">Input Method</Label>
                  <div className="flex gap-1">
                    <Button
                      variant={measurementDevice === 'manual' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMeasurementDevice('manual')}
                    >
                      Manual
                    </Button>
                    <Button
                      variant={measurementDevice === 'device' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setMeasurementDevice('device');
                        simulateDeviceSync();
                      }}
                    >
                      <Bluetooth className="h-3 w-3 mr-1" />
                      Sync
                    </Button>
                  </div>
                </div>

                {/* Right Eye */}
                <div className="p-3 border rounded-lg bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">OD</Badge>
                    <span className="text-xs font-medium">Right Eye</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">SPH</Label>
                      <Input
                        value={rx.rightEye.sphere}
                        onChange={(e) => setRx({
                          ...rx,
                          rightEye: { ...rx.rightEye, sphere: e.target.value }
                        })}
                        className="mt-1 h-9 text-center font-mono"
                        placeholder="±0.00"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">CYL</Label>
                      <Input
                        value={rx.rightEye.cylinder}
                        onChange={(e) => setRx({
                          ...rx,
                          rightEye: { ...rx.rightEye, cylinder: e.target.value }
                        })}
                        className="mt-1 h-9 text-center font-mono"
                        placeholder="±0.00"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">AXIS</Label>
                      <Input
                        value={rx.rightEye.axis}
                        onChange={(e) => setRx({
                          ...rx,
                          rightEye: { ...rx.rightEye, axis: e.target.value }
                        })}
                        className="mt-1 h-9 text-center font-mono"
                        placeholder="0-180"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">ADD</Label>
                      <Input
                        value={rx.rightEye.add}
                        onChange={(e) => setRx({
                          ...rx,
                          rightEye: { ...rx.rightEye, add: e.target.value }
                        })}
                        className="mt-1 h-9 text-center font-mono"
                        placeholder="+0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Left Eye */}
                <div className="p-3 border rounded-lg bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">OS</Badge>
                    <span className="text-xs font-medium">Left Eye</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">SPH</Label>
                      <Input
                        value={rx.leftEye.sphere}
                        onChange={(e) => setRx({
                          ...rx,
                          leftEye: { ...rx.leftEye, sphere: e.target.value }
                        })}
                        className="mt-1 h-9 text-center font-mono"
                        placeholder="±0.00"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">CYL</Label>
                      <Input
                        value={rx.leftEye.cylinder}
                        onChange={(e) => setRx({
                          ...rx,
                          leftEye: { ...rx.leftEye, cylinder: e.target.value }
                        })}
                        className="mt-1 h-9 text-center font-mono"
                        placeholder="±0.00"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">AXIS</Label>
                      <Input
                        value={rx.leftEye.axis}
                        onChange={(e) => setRx({
                          ...rx,
                          leftEye: { ...rx.leftEye, axis: e.target.value }
                        })}
                        className="mt-1 h-9 text-center font-mono"
                        placeholder="0-180"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">ADD</Label>
                      <Input
                        value={rx.leftEye.add}
                        onChange={(e) => setRx({
                          ...rx,
                          leftEye: { ...rx.leftEye, add: e.target.value }
                        })}
                        className="mt-1 h-9 text-center font-mono"
                        placeholder="+0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* PD */}
                <div className="p-3 border rounded-lg bg-background">
                  <Label className="text-xs font-medium mb-2 block">Pupillary Distance</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Right</Label>
                      <Input
                        value={rx.pd.right}
                        onChange={(e) => setRx({
                          ...rx,
                          pd: { ...rx.pd, right: e.target.value }
                        })}
                        className="mt-1 h-9 text-center font-mono"
                        placeholder="mm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Left</Label>
                      <Input
                        value={rx.pd.left}
                        onChange={(e) => setRx({
                          ...rx,
                          pd: { ...rx.pd, left: e.target.value }
                        })}
                        className="mt-1 h-9 text-center font-mono"
                        placeholder="mm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Binoc</Label>
                      <Input
                        value={rx.pd.binocular}
                        onChange={(e) => setRx({
                          ...rx,
                          pd: { ...rx.pd, binocular: e.target.value }
                        })}
                        className="mt-1 h-9 text-center font-mono"
                        placeholder="mm"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Center Panel - Package Selection & Frame */}
        <div className="flex-1 flex flex-col">
          {/* Package Selector */}
          <div className="p-4 border-b bg-gradient-to-r from-background to-muted/20">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Package Selection</Label>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => stepPackage('down')}
                  disabled={!selectedPackage || activePackages.findIndex(p => p.id === selectedPackage.id) === 0}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => stepPackage('up')}
                  disabled={!selectedPackage || activePackages.findIndex(p => p.id === selectedPackage.id) === activePackages.length - 1}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {activePackages.map((pkg, index) => (
                <button
                  key={pkg.id}
                  onClick={() => selectPackage(pkg)}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    selectedPackage?.id === pkg.id
                      ? 'border-primary bg-primary/10 shadow-lg scale-105'
                      : 'border-border bg-background hover:border-primary/50'
                  }`}
                >
                  {pkg.featured && (
                    <Star className="absolute top-1 right-1 h-3 w-3 text-yellow-500 fill-yellow-500" />
                  )}
                  <div className={`text-xs font-medium bg-gradient-to-r ${tierColors[pkg.tier]} text-white px-2 py-0.5 rounded mb-1 inline-block`}>
                    {pkg.tier.toUpperCase()}
                  </div>
                  <div className="font-medium text-sm">{pkg.name}</div>
                  <div className="text-lg font-bold mt-1">${pkg.price}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Ctrl+{index + 1}
                  </div>
                </button>
              ))}
            </div>

            {selectedPackage && (
              <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-medium mb-1">Includes:</div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {selectedPackage.includes.lensType.replace('-', ' ')}
                      </Badge>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {selectedPackage.includes.material}
                      </Badge>
                      {selectedPackage.includes.coatings.map(c => (
                        <Badge key={c} variant="secondary" className="text-xs">
                          {c}
                        </Badge>
                      ))}
                      {selectedPackage.includes.tintIncluded && (
                        <Badge variant="secondary" className="text-xs">Tint ✓</Badge>
                      )}
                      {selectedPackage.includes.rushProcessing && (
                        <Badge variant="secondary" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Rush
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPackageDetails(!showPackageDetails)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Frame & Customizations */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Frame Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Glasses className="h-4 w-4" />
                    Frame Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Brand</Label>
                      <Input
                        value={frame.brand}
                        onChange={(e) => setFrame({ ...frame, brand: e.target.value })}
                        className="mt-1"
                        placeholder="Ray-Ban"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Model</Label>
                      <Input
                        value={frame.model}
                        onChange={(e) => setFrame({ ...frame, model: e.target.value })}
                        className="mt-1"
                        placeholder="RB2132"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">SKU/Barcode</Label>
                      <Input
                        value={frame.sku}
                        onChange={(e) => setFrame({ ...frame, sku: e.target.value })}
                        className="mt-1"
                        placeholder="Scan or type"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Color</Label>
                      <Input
                        value={frame.color}
                        onChange={(e) => setFrame({ ...frame, color: e.target.value })}
                        className="mt-1"
                        placeholder="Black"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Size</Label>
                      <Input
                        value={frame.size}
                        onChange={(e) => setFrame({ ...frame, size: e.target.value })}
                        className="mt-1"
                        placeholder="52-18-140"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Frame Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={frame.price || ''}
                        onChange={(e) => setFrame({ ...frame, price: parseFloat(e.target.value) || 0 })}
                        className="mt-1"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {selectedPackage?.frameMaxValue && frame.price > selectedPackage.frameMaxValue && (
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded text-xs">
                      Frame exceeds package allowance by ${(frame.price - selectedPackage.frameMaxValue).toFixed(2)}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customizations */}
              {selectedPackage && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Additional Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs mb-2 block">Extra Coatings</Label>
                      <div className="flex flex-wrap gap-2">
                        {['Photochromic', 'Polarized', 'Mirror Coating'].map(coating => (
                          <button
                            key={coating}
                            onClick={() => {
                              if (additionalCoatings.includes(coating)) {
                                setAdditionalCoatings(additionalCoatings.filter(c => c !== coating));
                              } else {
                                setAdditionalCoatings([...additionalCoatings, coating]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                              additionalCoatings.includes(coating)
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-border hover:border-primary'
                            }`}
                          >
                            {additionalCoatings.includes(coating) && <Check className="inline h-3 w-3 mr-1" />}
                            {coating}
                            <span className="ml-2 opacity-70">+$35</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="text-sm font-medium">Tint Upgrade</div>
                        <div className="text-xs text-muted-foreground">Custom tinting service</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm">+$45</span>
                        <button
                          onClick={() => setTintUpgrade(!tintUpgrade)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            tintUpgrade ? 'bg-primary' : 'bg-muted'
                          }`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            tintUpgrade ? 'right-0.5' : 'left-0.5'
                          }`} />
                        </button>
                      </div>
                    </div>

                    {!selectedPackage.includes.rushProcessing && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="text-sm font-medium flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            Rush Processing
                          </div>
                          <div className="text-xs text-muted-foreground">Ready in 3-5 days</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm">+$75</span>
                          <button
                            onClick={() => setRushProcessing(!rushProcessing)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${
                              rushProcessing ? 'bg-primary' : 'bg-muted'
                            }`}
                          >
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                              rushProcessing ? 'right-0.5' : 'left-0.5'
                            }`} />
                          </button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Pricing & Quotes */}
        <div className="w-[380px] border-l bg-muted/20 flex flex-col">
          {/* Current Price */}
          <div className="p-4 border-b bg-gradient-to-br from-primary/10 to-purple-500/10">
            <Label className="text-xs text-muted-foreground mb-2 block">Total Price</Label>
            <div className="text-4xl font-bold mb-1">
              ${calculatePrice().toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              +${(calculatePrice() * 0.1).toFixed(2)} GST
            </div>
            <div className="text-sm font-medium mt-1">
              Final: ${(calculatePrice() * 1.1).toFixed(2)}
            </div>
          </div>

          {/* Comparative Quotes */}
          <div className="flex-1 flex flex-col">
            <div className="p-3 border-b flex items-center justify-between">
              <Label className="text-xs font-medium">Quote Comparison</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addComparativeQuote}
                disabled={!selectedPackage}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add (Ctrl+Q)
              </Button>
            </div>

            <ScrollArea className="flex-1 p-3">
              {quotes.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Create quotes to compare<br />different packages & options
                </div>
              ) : (
                <div className="space-y-2">
                  {quotes.map(quote => (
                    <div
                      key={quote.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        activeQuoteId === quote.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-background hover:border-primary/50'
                      }`}
                      onClick={() => loadQuote(quote)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{quote.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {quote.packageDeal?.name}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQuote(quote.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-xl font-bold">
                        ${quote.totalPrice.toFixed(2)}
                      </div>
                      {quote.customizations.additionalCoatings.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          +{quote.customizations.additionalCoatings.length} extra coating(s)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
