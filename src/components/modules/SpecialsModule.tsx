import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Tag, Plus, Trash2, Percent, Calendar, Clock, Edit, Copy, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Special {
  id: string;
  itemName: string;
  itemSku?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  posCode: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  createdAt: Date;
}

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage Off (%)' },
  { value: 'fixed', label: 'Fixed Amount Off ($)' },
];

export function SpecialsModule() {
  const [specials, setSpecials] = useState<Special[]>(() => {
    const saved = localStorage.getItem('specials');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((s: Special) => ({
        ...s,
        startDate: new Date(s.startDate),
        endDate: new Date(s.endDate),
        createdAt: new Date(s.createdAt),
      }));
    }
    return [];
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpecial, setEditingSpecial] = useState<Special | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  // Form state
  const [itemName, setItemName] = useState('');
  const [itemSku, setItemSku] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [posCode, setPosCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    localStorage.setItem('specials', JSON.stringify(specials));
  }, [specials]);

  useEffect(() => {
    // Check for expired specials on mount and every hour
    const checkExpiration = () => {
      const now = new Date();
      const updated = specials.map(special => ({
        ...special,
        isExpired: new Date(special.endDate) < now,
      }));
      
      // Force re-render if any specials changed expiration status
      const hasChanges = updated.some((s, idx) => {
        const original = specials[idx];
        const wasExpired = new Date(original.endDate) < now;
        return s.isExpired !== wasExpired;
      });
      
      if (hasChanges) {
        setSpecials([...specials]); // Trigger re-render
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 3600000); // Every hour
    
    return () => clearInterval(interval);
  }, [specials]);

  const resetForm = () => {
    setItemName('');
    setItemSku('');
    setDiscountType('percentage');
    setDiscountValue('');
    setPosCode('');
    setStartDate('');
    setEndDate('');
    setDescription('');
    setEditingSpecial(null);
  };

  const openEditDialog = (special: Special) => {
    setEditingSpecial(special);
    setItemName(special.itemName);
    setItemSku(special.itemSku || '');
    setDiscountType(special.discountType);
    setDiscountValue(special.discountValue.toString());
    setPosCode(special.posCode);
    setStartDate(formatDateForInput(special.startDate));
    setEndDate(formatDateForInput(special.endDate));
    setDescription(special.description || '');
    setDialogOpen(true);
  };

  const formatDateForInput = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSave = () => {
    // Validation
    if (!itemName.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!posCode.trim()) {
      toast.error('POS code is required');
      return;
    }
    if (!discountValue || parseFloat(discountValue) <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Start and end dates are required');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      toast.error('End date must be after start date');
      return;
    }

    // Check for duplicate POS codes
    const duplicateCode = specials.find(
      s => s.posCode.toLowerCase() === posCode.toLowerCase() && s.id !== editingSpecial?.id
    );
    if (duplicateCode) {
      toast.error('POS code already exists', {
        description: `Code "${posCode}" is already used for "${duplicateCode.itemName}"`,
      });
      return;
    }

    if (editingSpecial) {
      // Update existing special
      setSpecials(prev =>
        prev.map(s =>
          s.id === editingSpecial.id
            ? {
                ...s,
                itemName,
                itemSku,
                discountType,
                discountValue: parseFloat(discountValue),
                posCode,
                startDate: start,
                endDate: end,
                description,
              }
            : s
        )
      );
      toast.success('Special updated successfully');
    } else {
      // Create new special
      const newSpecial: Special = {
        id: Date.now().toString(),
        itemName,
        itemSku,
        discountType,
        discountValue: parseFloat(discountValue),
        posCode,
        startDate: start,
        endDate: end,
        description,
        createdAt: new Date(),
      };
      setSpecials(prev => [...prev, newSpecial]);
      toast.success('Special created successfully', {
        description: `POS Code: ${posCode}`,
      });
    }

    resetForm();
    setDialogOpen(false);
  };

  const deleteSpecial = (id: string) => {
    const special = specials.find(s => s.id === id);
    setSpecials(prev => prev.filter(s => s.id !== id));
    toast.success('Special deleted', {
      description: special ? `${special.itemName} - ${special.posCode}` : undefined,
    });
  };

  const copyPosCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('POS code copied to clipboard', {
      description: code,
    });
  };

  const getSpecialStatus = (special: Special): 'active' | 'upcoming' | 'expired' => {
    const now = new Date();
    const start = new Date(special.startDate);
    const end = new Date(special.endDate);

    if (now < start) return 'upcoming';
    if (now > end) return 'expired';
    return 'active';
  };

  const getDaysRemaining = (endDate: Date): number => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDiscount = (special: Special) => {
    if (special.discountType === 'percentage') {
      return `${special.discountValue}% OFF`;
    }
    return `$${special.discountValue.toFixed(2)} OFF`;
  };

  // Filter specials
  const filteredSpecials = specials.filter(special => {
    const status = getSpecialStatus(special);
    const matchesTab = 
      (activeTab === 'active' && status === 'active') ||
      (activeTab === 'upcoming' && status === 'upcoming') ||
      (activeTab === 'expired' && status === 'expired') ||
      activeTab === 'all';

    if (!matchesTab) return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        special.itemName.toLowerCase().includes(query) ||
        special.posCode.toLowerCase().includes(query) ||
        special.itemSku?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const activeSpecials = specials.filter(s => getSpecialStatus(s) === 'active');
  const upcomingSpecials = specials.filter(s => getSpecialStatus(s) === 'upcoming');
  const expiredSpecials = specials.filter(s => getSpecialStatus(s) === 'expired');

  const getStatusBadge = (status: 'active' | 'upcoming' | 'expired') => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Upcoming</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Specials Manager
              {activeSpecials.length > 0 && (
                <Badge className="bg-green-500 hover:bg-green-600">
                  {activeSpecials.length} Active
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Manage promotional specials with POS codes and automatic expiration</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Special
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSpecial ? 'Edit Special' : 'Create New Special'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="item-name">Item Name *</Label>
                    <Input
                      id="item-name"
                      value={itemName}
                      onChange={e => setItemName(e.target.value)}
                      placeholder="e.g., Premium Coffee Beans"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="item-sku">SKU (Optional)</Label>
                    <Input
                      id="item-sku"
                      value={itemSku}
                      onChange={e => setItemSku(e.target.value)}
                      placeholder="e.g., COFFEE-001"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pos-code">POS Code *</Label>
                    <Input
                      id="pos-code"
                      value={posCode}
                      onChange={e => setPosCode(e.target.value.toUpperCase())}
                      placeholder="e.g., COFFEE20"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount-type">Discount Type *</Label>
                    <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'percentage' | 'fixed')}>
                      <SelectTrigger id="discount-type" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DISCOUNT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discount-value">
                      {discountType === 'percentage' ? 'Percentage (%)' : 'Amount ($)'} *
                    </Label>
                    <Input
                      id="discount-value"
                      type="number"
                      step="0.01"
                      min="0"
                      value={discountValue}
                      onChange={e => setDiscountValue(e.target.value)}
                      placeholder={discountType === 'percentage' ? 'e.g., 20' : 'e.g., 5.00'}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="start-date">Start Date *</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date *</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="e.g., Holiday promotion for premium coffee"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} className="flex-1">
                    {editingSpecial ? 'Update Special' : 'Create Special'}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    resetForm();
                    setDialogOpen(false);
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Search by Item or POS Code</Label>
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search specials..."
            className="mt-1"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active" className="gap-2">
              Active
              {activeSpecials.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5">
                  {activeSpecials.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              Upcoming
              {upcomingSpecials.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5">
                  {upcomingSpecials.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="expired" className="gap-2">
              Expired
              {expiredSpecials.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5">
                  {expiredSpecials.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-2 mt-4">
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredSpecials.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery ? (
                    <>No specials match your search.</>
                  ) : (
                    <>No {activeTab !== 'all' ? activeTab : ''} specials. Create one to get started.</>
                  )}
                </div>
              ) : (
                filteredSpecials
                  .sort((a, b) => {
                    // Sort active specials by days remaining (ascending)
                    const statusA = getSpecialStatus(a);
                    const statusB = getSpecialStatus(b);
                    
                    if (statusA === 'active' && statusB === 'active') {
                      return getDaysRemaining(a.endDate) - getDaysRemaining(b.endDate);
                    }
                    
                    // Sort upcoming by start date
                    if (statusA === 'upcoming' && statusB === 'upcoming') {
                      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                    }
                    
                    // Sort expired by end date (most recent first)
                    if (statusA === 'expired' && statusB === 'expired') {
                      return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
                    }
                    
                    return 0;
                  })
                  .map(special => {
                    const status = getSpecialStatus(special);
                    const daysRemaining = getDaysRemaining(special.endDate);

                    return (
                      <div
                        key={special.id}
                        className={`p-4 rounded-lg border bg-card ${
                          status === 'expired' ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="font-medium">{special.itemName}</span>
                              {special.itemSku && (
                                <Badge variant="outline" className="text-xs">
                                  {special.itemSku}
                                </Badge>
                              )}
                              {getStatusBadge(status)}
                              <Badge variant="secondary" className="gap-1">
                                <Percent className="h-3 w-3" />
                                {formatDiscount(special)}
                              </Badge>
                            </div>

                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Tag className="h-3 w-3" />
                                <span>POS Code:</span>
                                <code className="px-2 py-0.5 bg-muted rounded font-mono">
                                  {special.posCode}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyPosCode(special.posCode)}
                                  title="Copy POS code"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {formatDate(special.startDate)} → {formatDate(special.endDate)}
                                </span>
                              </div>

                              {status === 'active' && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {daysRemaining > 0 ? (
                                      <>
                                        {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                                      </>
                                    ) : (
                                      <>Expires today</>
                                    )}
                                  </span>
                                  {daysRemaining <= 3 && (
                                    <Badge variant="destructive" className="h-5 text-xs gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      Ending Soon
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {status === 'upcoming' && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    Starts in {Math.ceil((new Date(special.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                                  </span>
                                </div>
                              )}

                              {special.description && (
                                <div className="text-xs mt-2 pt-2 border-t">
                                  {special.description}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(special)}
                              title="Edit special"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => deleteSpecial(special.id)}
                              title="Delete special"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {filteredSpecials.length > 0 && (
              <div className="flex gap-4 text-sm text-muted-foreground border-t pt-4">
                <span>Total: {filteredSpecials.length}</span>
                {activeTab === 'active' && (
                  <span className="text-destructive">
                    Ending Soon: {filteredSpecials.filter(s => getDaysRemaining(s.endDate) <= 3).length}
                  </span>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
