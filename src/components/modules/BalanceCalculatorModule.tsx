import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Scale, Plus, AlertTriangle, X, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface BalanceEntry {
  id: string;
  column: 'left' | 'right';
  amount: number;
  description: string;
  timestamp: number;
}

export function BalanceCalculatorModule() {
  const [entries, setEntries] = useState<BalanceEntry[]>(() => {
    const saved = localStorage.getItem('balance-entries');
    return saved ? JSON.parse(saved) : [];
  });
  const [leftAmount, setLeftAmount] = useState('');
  const [leftDescription, setLeftDescription] = useState('');
  const [rightAmount, setRightAmount] = useState('');
  const [rightDescription, setRightDescription] = useState('');

  useEffect(() => {
    localStorage.setItem('balance-entries', JSON.stringify(entries));
  }, [entries]);

  const addLeftEntry = () => {
    const amount = parseFloat(leftAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!leftDescription.trim()) {
      toast.error('Please enter a description');
      return;
    }

    const newEntry: BalanceEntry = {
      id: Date.now().toString(),
      column: 'left',
      amount,
      description: leftDescription,
      timestamp: Date.now(),
    };

    setEntries(prev => [newEntry, ...prev]);
    setLeftAmount('');
    setLeftDescription('');
    toast.success('Left column entry added');
  };

  const addRightEntry = () => {
    const amount = parseFloat(rightAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!rightDescription.trim()) {
      toast.error('Please enter a description');
      return;
    }

    const newEntry: BalanceEntry = {
      id: Date.now().toString(),
      column: 'right',
      amount,
      description: rightDescription,
      timestamp: Date.now(),
    };

    setEntries(prev => [newEntry, ...prev]);
    setRightAmount('');
    setRightDescription('');
    toast.success('Right column entry added');
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
    toast.success('Entry removed');
  };

  const clearAll = () => {
    toast('Clear all balance entries?', {
      action: {
        label: 'Clear',
        onClick: () => {
          setEntries([]);
          toast.success('All entries cleared');
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const leftTotal = entries
    .filter(e => e.column === 'left')
    .reduce((sum, e) => sum + e.amount, 0);

  const rightTotal = entries
    .filter(e => e.column === 'right')
    .reduce((sum, e) => sum + e.amount, 0);

  const difference = leftTotal - rightTotal;
  const hasDifference = Math.abs(difference) > 0.01;

  const leftEntries = entries.filter(e => e.column === 'left');
  const rightEntries = entries.filter(e => e.column === 'right');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Balance Calculator
            </CardTitle>
            <CardDescription>Compare two columns to find the difference</CardDescription>
          </div>
          {entries.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 border rounded-lg bg-blue-500/5 border-blue-500/20">
            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 mb-1">
              <TrendingUp className="h-3 w-3" />
              <span>Left Total</span>
            </div>
            <div className="text-xl tabular-nums">
              ${leftTotal.toFixed(2)}
            </div>
          </div>

          <div className="p-3 border rounded-lg bg-purple-500/5 border-purple-500/20">
            <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-400 mb-1">
              <TrendingDown className="h-3 w-3" />
              <span>Right Total</span>
            </div>
            <div className="text-xl tabular-nums">
              ${rightTotal.toFixed(2)}
            </div>
          </div>

          <div className={`p-3 border rounded-lg ${
            hasDifference 
              ? difference > 0 
                ? 'bg-green-500/5 border-green-500/20' 
                : 'bg-orange-500/5 border-orange-500/20'
              : 'bg-muted/50'
          }`}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              {hasDifference && <AlertTriangle className="h-3 w-3" />}
              <span>Difference</span>
            </div>
            <div className={`text-xl tabular-nums ${
              hasDifference 
                ? difference > 0 
                  ? 'text-green-700 dark:text-green-400' 
                  : 'text-orange-700 dark:text-orange-400'
                : ''
            }`}>
              ${Math.abs(difference).toFixed(2)}
              {difference !== 0 && (
                <span className="text-xs ml-1">
                  {difference > 0 ? 'L' : 'R'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Two Column Input */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left Column */}
          <div className="p-4 border rounded-lg bg-blue-500/5 border-blue-500/20 space-y-3">
            <Label className="text-blue-700 dark:text-blue-400">Left Column</Label>
            <div>
              <Label htmlFor="left-amount" className="text-xs">Amount</Label>
              <Input
                id="left-amount"
                type="number"
                step="0.01"
                min="0"
                value={leftAmount}
                onChange={e => setLeftAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1"
                onKeyDown={e => e.key === 'Enter' && leftDescription && addLeftEntry()}
              />
            </div>
            <div>
              <Label htmlFor="left-description" className="text-xs">Description</Label>
              <Input
                id="left-description"
                value={leftDescription}
                onChange={e => setLeftDescription(e.target.value)}
                placeholder="Description..."
                className="mt-1"
                onKeyDown={e => e.key === 'Enter' && leftAmount && addLeftEntry()}
              />
            </div>
            <Button onClick={addLeftEntry} size="sm" className="w-full">
              <Plus className="h-3 w-3 mr-2" />
              Add
            </Button>
          </div>

          {/* Right Column */}
          <div className="p-4 border rounded-lg bg-purple-500/5 border-purple-500/20 space-y-3">
            <Label className="text-purple-700 dark:text-purple-400">Right Column</Label>
            <div>
              <Label htmlFor="right-amount" className="text-xs">Amount</Label>
              <Input
                id="right-amount"
                type="number"
                step="0.01"
                min="0"
                value={rightAmount}
                onChange={e => setRightAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1"
                onKeyDown={e => e.key === 'Enter' && rightDescription && addRightEntry()}
              />
            </div>
            <div>
              <Label htmlFor="right-description" className="text-xs">Description</Label>
              <Input
                id="right-description"
                value={rightDescription}
                onChange={e => setRightDescription(e.target.value)}
                placeholder="Description..."
                className="mt-1"
                onKeyDown={e => e.key === 'Enter' && rightAmount && addRightEntry()}
              />
            </div>
            <Button onClick={addRightEntry} size="sm" className="w-full">
              <Plus className="h-3 w-3 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Entries Lists in Two Columns */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left Entries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Left Entries ({leftEntries.length})</Label>
            </div>
            <ScrollArea className="h-[250px] border rounded-lg bg-blue-500/5 border-blue-500/20">
              {leftEntries.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No entries yet
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {leftEntries.map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-start justify-between p-2 border rounded-lg bg-background"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{entry.description}</div>
                        <div className="font-mono text-sm mt-1 text-blue-700 dark:text-blue-400">
                          ${entry.amount.toFixed(2)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => deleteEntry(entry.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Entries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Right Entries ({rightEntries.length})</Label>
            </div>
            <ScrollArea className="h-[250px] border rounded-lg bg-purple-500/5 border-purple-500/20">
              {rightEntries.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No entries yet
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {rightEntries.map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-start justify-between p-2 border rounded-lg bg-background"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{entry.description}</div>
                        <div className="font-mono text-sm mt-1 text-purple-700 dark:text-purple-400">
                          ${entry.amount.toFixed(2)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => deleteEntry(entry.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {hasDifference && (
          <div className={`p-3 border rounded-lg flex items-start gap-2 ${
            difference > 0 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-orange-500/10 border-orange-500/20'
          }`}>
            <AlertTriangle className={`h-4 w-4 mt-0.5 ${
              difference > 0 ? 'text-green-600' : 'text-orange-600'
            }`} />
            <div className="text-sm">
              <div className={difference > 0 ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}>
                Difference Detected
              </div>
              <div className="text-muted-foreground mt-1">
                {difference > 0 
                  ? `Left column is $${difference.toFixed(2)} higher than right column.`
                  : `Right column is $${Math.abs(difference).toFixed(2)} higher than left column.`
                }
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
