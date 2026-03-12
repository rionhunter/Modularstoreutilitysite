import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { DollarSign, RotateCcw, ArrowDown } from 'lucide-react';

interface CashEntry {
  denomination: number;
  count: number;
}

const DENOMINATIONS = [100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05];

export function CashCalculatorModule() {
  const [float, setFloat] = useState<number>(0);
  const [entries, setEntries] = useState<Record<number, number>>(
    Object.fromEntries(DENOMINATIONS.map(d => [d, 0]))
  );

  const total = DENOMINATIONS.reduce(
    (sum, denom) => sum + denom * (entries[denom] || 0),
    0
  );

  const endOfDay = total - float;

  // Calculate optimal denominations to reach the float
  const floatBreakdown = useMemo(() => {
    if (float <= 0) return null;

    const result: Record<number, number> = {};
    let remaining = float;

    // Step 1: Try to include at least 1 of each denomination (starting from smallest)
    // This ensures we have change available
    const reversedDenoms = [...DENOMINATIONS].reverse();
    for (const denom of reversedDenoms) {
      if (remaining >= denom) {
        result[denom] = 1;
        remaining = Math.round((remaining - denom) * 100) / 100;
      }
    }

    // Step 2: Fill remaining amount with larger denominations (greedy approach)
    for (const denom of DENOMINATIONS) {
      if (remaining >= denom) {
        const count = Math.floor(remaining / denom);
        result[denom] = (result[denom] || 0) + count;
        remaining = Math.round((remaining - denom * count) * 100) / 100;
      }
    }

    // If we can't make exact change, return null
    if (remaining > 0.001) {
      return null;
    }

    return result;
  }, [float]);

  const handleCountChange = (denomination: number, value: string) => {
    const count = parseInt(value) || 0;
    setEntries(prev => ({ ...prev, [denomination]: count }));
  };

  const handleReset = () => {
    setEntries(Object.fromEntries(DENOMINATIONS.map(d => [d, 0])));
    setFloat(0);
  };

  const applyFloatBreakdown = () => {
    if (floatBreakdown) {
      setEntries(prev => {
        const newEntries = { ...prev };
        Object.entries(floatBreakdown).forEach(([denom, count]) => {
          newEntries[parseFloat(denom)] = count;
        });
        return newEntries;
      });
    }
  };

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
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cash Calculator
            </CardTitle>
            <CardDescription>End of day cash reconciliation</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="float">Starting Float</Label>
          <Input
            id="float"
            type="number"
            step="0.01"
            value={float}
            onChange={e => setFloat(parseFloat(e.target.value) || 0)}
            className="mt-1"
          />
        </div>

        {floatBreakdown && float > 0 && (
          <div className="p-3 border rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Float Breakdown</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={applyFloatBreakdown}
              >
                <ArrowDown className="h-3 w-3 mr-2" />
                Apply
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {DENOMINATIONS.map(denom => {
                const count = floatBreakdown[denom];
                if (!count) return null;
                return (
                  <div key={denom} className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">{formatCurrency(denom)}:</span>
                    <span className="font-mono">×{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Optimized for at least 1 of each denomination (where possible)
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <Label>Cash Count</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DENOMINATIONS.map(denom => (
              <div key={denom} className="flex items-center gap-2">
                <Label className="min-w-[60px] text-sm">{formatCurrency(denom)}</Label>
                <Input
                  type="number"
                  min="0"
                  value={entries[denom] || ''}
                  onChange={e => handleCountChange(denom, e.target.value)}
                  placeholder="0"
                  className="h-8"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Cash:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Starting Float:</span>
            <span>{formatCurrency(float)}</span>
          </div>
          <div className="flex justify-between">
            <span>End of Day Total:</span>
            <span className="font-mono">{formatCurrency(endOfDay)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}