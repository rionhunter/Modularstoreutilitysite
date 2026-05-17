import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { FileText, Plus, Trash2, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

interface Quote {
  id: string;
  customerName: string;
  items: QuoteItem[];
  total: number;
  createdAt: Date;
  expiryDate: Date;
}

export function QuoteSystemModule() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  
  const [customerName, setCustomerName] = useState('');
  const [expiryDays, setExpiryDays] = useState('30');
  const [items, setItems] = useState<QuoteItem[]>([
    { id: '1', description: '', quantity: 1, price: 0 },
  ]);

  const addItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), description: '', quantity: 1, price: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const createQuote = () => {
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    if (items.some(item => !item.description.trim())) {
      toast.error('Please fill in all item descriptions');
      return;
    }

    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + parseInt(expiryDays));

    const newQuote: Quote = {
      id: Date.now().toString(),
      customerName,
      items: items.map(item => ({ ...item })),
      total: calculateTotal(),
      createdAt: now,
      expiryDate: expiry,
    };

    setQuotes(prev => [newQuote, ...prev]);
    resetForm();
    setDialogOpen(false);
    toast.success('Quote created successfully');
  };

  const resetForm = () => {
    setCustomerName('');
    setExpiryDays('30');
    setItems([{ id: '1', description: '', quantity: 1, price: 0 }]);
  };

  const viewQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setViewDialogOpen(true);
  };

  const deleteQuote = (quoteId: string) => {
    setQuotes(prev => prev.filter(q => q.id !== quoteId));
    toast.success('Quote deleted');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quick Quote System
            </CardTitle>
            <CardDescription>Generate customer quotes instantly</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Quote</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer">Customer Name</Label>
                    <Input
                      id="customer"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="John Doe"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiry">Valid For (days)</Label>
                    <Input
                      id="expiry"
                      type="number"
                      value={expiryDays}
                      onChange={e => setExpiryDays(e.target.value)}
                      min="1"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Quote Items</Label>
                    <Button onClick={addItem} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                  
                  {items.map((item, index) => (
                    <div key={item.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Item {index + 1}</span>
                        {items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          min="1"
                        />
                        <Input
                          type="number"
                          placeholder="Price"
                          value={item.price}
                          onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div className="text-sm text-right text-muted-foreground">
                        Subtotal: {formatCurrency(item.quantity * item.price)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <span>Total:</span>
                  <span className="font-mono text-xl">{formatCurrency(calculateTotal())}</span>
                </div>

                <Button onClick={createQuote} className="w-full">
                  Create Quote
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {quotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No quotes yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {quotes.map(quote => (
              <div key={quote.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{quote.customerName}</span>
                      <span className="text-xs text-muted-foreground">
                        • {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Created: {formatDate(quote.createdAt)} • 
                      Expires: {formatDate(quote.expiryDate)}
                    </div>
                    <div className="font-mono mt-2">
                      {formatCurrency(quote.total)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => viewQuote(quote)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteQuote(quote.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Quote Details</DialogTitle>
            </DialogHeader>
            {selectedQuote && (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Customer:</span>
                    <div>{selectedQuote.customerName}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quote ID:</span>
                    <div className="font-mono text-xs">#{selectedQuote.id}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <div>{formatDate(selectedQuote.createdAt)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expires:</span>
                    <div>{formatDate(selectedQuote.expiryDate)}</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label>Items</Label>
                  <div className="space-y-2 mt-2">
                    {selectedQuote.items.map((item, index) => (
                      <div key={item.id} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                        <div className="flex-1">
                          <div>{item.description}</div>
                          <div className="text-muted-foreground">
                            {item.quantity} × {formatCurrency(item.price)}
                          </div>
                        </div>
                        <div className="font-mono">
                          {formatCurrency(item.quantity * item.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <span>Total:</span>
                  <span className="font-mono text-xl">
                    {formatCurrency(selectedQuote.total)}
                  </span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
