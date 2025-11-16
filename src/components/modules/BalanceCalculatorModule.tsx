import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { DollarSign, Plus, Minus, AlertTriangle, TrendingUp, TrendingDown, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface BalanceEntry {
  id: string;
  type: 'incoming' | 'outgoing';
  amount: number;
  description: string;
  timestamp: number;
}

export function BalanceCalculatorModule() {
  const [entries, setEntries] = useState<BalanceEntry[]>(() => {
    const saved = localStorage.getItem('balance-entries');
    return saved ? JSON.parse(saved) : [];
  });
  const [newAmount, setNewAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [entryType, setEntryType] = useState<'incoming' | 'outgoing'>('incoming');

  useEffect(() => {
    localStorage.setItem('balance-entries', JSON.stringify(entries));
  }, [entries]);

  const addEntry = () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!newDescription.trim()) {
      toast.error('Please enter a description');
      return;
    }

    const newEntry: BalanceEntry = {
      id: Date.now().toString(),
      type: entryType,
      amount,
      description: newDescription,
      timestamp: Date.now(),
    };

    setEntries(prev => [newEntry, ...prev]);
    setNewAmount('');
    setNewDescription('');
    toast.success(`${entryType === 'incoming' ? 'Incoming' : 'Outgoing'} amount added`);
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
    toast.success('Entry removed');
  };

  const clearAll = () => {
    if (confirm('Clear all balance entries?')) {
      setEntries([]);
      toast.success('All entries cleared');
    }
  };

  const totalIncoming = entries
    .filter(e => e.type === 'incoming')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalOutgoing = entries
    .filter(e => e.type === 'outgoing')
    .reduce((sum, e) => sum + e.amount, 0);

  const balance = totalIncoming - totalOutgoing;
  const hasDiscrepancy = balance !== 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Balance Calculator
            </CardTitle>
            <CardDescription>Track incoming and outgoing amounts</CardDescription>
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
          <div className="p-3 border rounded-lg bg-green-500/5 border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 mb-1">
              <TrendingUp className="h-3 w-3" />
              <span>Incoming</span>
            </div>
            <div className="text-xl tabular-nums">
              ${totalIncoming.toFixed(2)}
            </div>
          </div>

          <div className="p-3 border rounded-lg bg-red-500/5 border-red-500/20">
            <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-400 mb-1">
              <TrendingDown className="h-3 w-3" />
              <span>Outgoing</span>
            </div>
            <div className="text-xl tabular-nums">
              ${totalOutgoing.toFixed(2)}
            </div>
          </div>

          <div className={`p-3 border rounded-lg ${
            hasDiscrepancy 
              ? balance > 0 
                ? 'bg-blue-500/5 border-blue-500/20' 
                : 'bg-orange-500/5 border-orange-500/20'
              : 'bg-muted/50'
          }`}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              {hasDiscrepancy && <AlertTriangle className="h-3 w-3" />}
              <span>Balance</span>
            </div>
            <div className={`text-xl tabular-nums ${
              hasDiscrepancy 
                ? balance > 0 
                  ? 'text-blue-700 dark:text-blue-400' 
                  : 'text-orange-700 dark:text-orange-400'
                : ''
            }`}>
              ${Math.abs(balance).toFixed(2)}
              {balance !== 0 && (
                <span className="text-xs ml-1">
                  {balance > 0 ? 'over' : 'short'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Add Entry Form */}
        <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
          <div>
            <Label>Entry Type</Label>
            <div className="flex gap-2 mt-1">
              <Button
                variant={entryType === 'incoming' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEntryType('incoming')}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Incoming
              </Button>
              <Button
                variant={entryType === 'outgoing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEntryType('outgoing')}
                className="flex-1"
              >
                <Minus className="h-4 w-4 mr-2" />
                Outgoing
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Payment, sale, expense, etc."
              className="mt-1"
              onKeyDown={e => e.key === 'Enter' && addEntry()}
            />
          </div>

          <Button onClick={addEntry} className="w-full">
            Add Entry
          </Button>
        </div>

        {/* Entries List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Entries ({entries.length})</Label>
          </div>
          <ScrollArea className="h-[300px] border rounded-lg">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No entries yet. Add incoming or outgoing amounts above.
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {entries.map(entry => (
                  <div
                    key={entry.id}
                    className={`flex items-start justify-between p-2 border rounded-lg ${
                      entry.type === 'incoming' 
                        ? 'bg-green-500/5 border-green-500/20' 
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {entry.type === 'incoming' ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className="text-sm">{entry.description}</span>
                      </div>
                      <div className={`font-mono text-sm mt-1 ${
                        entry.type === 'incoming' 
                          ? 'text-green-700 dark:text-green-400' 
                          : 'text-red-700 dark:text-red-400'
                      }`}>
                        {entry.type === 'incoming' ? '+' : '-'}${entry.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
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

        {hasDiscrepancy && (
          <div className={`p-3 border rounded-lg flex items-start gap-2 ${
            balance > 0 
              ? 'bg-blue-500/10 border-blue-500/20' 
              : 'bg-orange-500/10 border-orange-500/20'
          }`}>
            <AlertTriangle className={`h-4 w-4 mt-0.5 ${
              balance > 0 ? 'text-blue-600' : 'text-orange-600'
            }`} />
            <div className="text-sm">
              <div className={balance > 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}>
                Discrepancy Detected
              </div>
              <div className="text-muted-foreground mt-1">
                {balance > 0 
                  ? `There is $${balance.toFixed(2)} more incoming than outgoing.`
                  : `There is $${Math.abs(balance).toFixed(2)} more outgoing than incoming.`
                }
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
