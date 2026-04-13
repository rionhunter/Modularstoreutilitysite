import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { RotateCcw, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { parseTransactionInput, ParsedTransaction } from '../../utils/transactionParser';

interface Category {
  id: string;
  name: string;
  total: number;
  color: string;
}

const PRESET_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-cyan-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-indigo-500',
];

export function TransactionCalculatorModule() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ParsedTransaction | null>(null);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const parsed = parseTransactionInput(value);
    setParsedPreview(parsed);
  };

  const handleSubmit = () => {
    const parsed = parseTransactionInput(inputValue);
    
    if (!parsed) {
      toast.error('Invalid format', {
        description: 'Use format like "cash150" or "150card" (one category + one amount)',
      });
      return;
    }

    // Find or create category
    let category = categories.find(
      cat => cat.name.toLowerCase() === parsed.category.toLowerCase()
    );

    if (!category) {
      // Create new category
      const newCategory: Category = {
        id: Date.now().toString(),
        name: parsed.category,
        total: 0,
        color: PRESET_COLORS[categories.length % PRESET_COLORS.length],
      };
      category = newCategory;
      setCategories(prev => [...prev, newCategory]);
    }

    // Add amount to category
    setCategories(prev =>
      prev.map(cat =>
        cat.id === category!.id
          ? { ...cat, total: cat.total + parsed.amount }
          : cat
      )
    );

    toast.success(`Added ${formatCurrency(parsed.amount)} to ${category.name}`);
    setInputValue('');
    setParsedPreview(null);
  };

  const removeCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
  };

  const resetCategory = (categoryId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, total: 0 } : cat
      )
    );
  };

  const resetAll = () => {
    setCategories([]);
    setInputValue('');
    setParsedPreview(null);
  };

  const grandTotal = categories.reduce((sum, cat) => sum + cat.total, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transaction Calculator</CardTitle>
            <CardDescription>Smart category parsing - e.g., "cash150", "150card", or "150" (general)</CardDescription>
          </div>
          {categories.length > 0 && (
            <Button variant="ghost" size="sm" onClick={resetAll}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="smart-input">Quick Entry</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="smart-input"
                value={inputValue}
                onChange={e => handleInputChange(e.target.value)}
                placeholder="e.g., cash150, 75card, bup200, or 150"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSubmit();
                  }
                }}
                className={parsedPreview ? 'border-green-500' : ''}
              />
              {parsedPreview && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <span className="capitalize">{parsedPreview.category}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-mono">{formatCurrency(parsedPreview.amount)}</span>
                </div>
              )}
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={!parsedPreview}
            >
              Add
            </Button>
          </div>
        </div>

        {categories.length > 0 && (
          <>
            <div className="space-y-2">
              <Label>Category Totals</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {categories.map(category => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${category.color}`} />
                      <span className="text-sm capitalize">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {formatCurrency(category.total)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => resetCategory(category.id)}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeCategory(category.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span>Grand Total:</span>
                <span className="font-mono text-xl">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </>
        )}

        {categories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>Enter a transaction using category + amount</p>
            <p className="mt-1">Examples: "cash150", "card75", "bup200"</p>
            <p className="mt-1 text-xs">Or just "150" for general category</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
