import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Glasses, 
  Zap,
  Search,
  Plus
} from 'lucide-react';
import { getAdminConfig } from '../../utils/adminConfig';
import { OpticalPOSScreen } from '../pos/OpticalPOSScreen';

export function OpticalSalesPage() {
  const [showPOS, setShowPOS] = useState(false);
  const [adminConfig, setAdminConfig] = useState(getAdminConfig());

  // Listen for admin config updates
  useEffect(() => {
    const handleConfigUpdate = ((e: CustomEvent) => {
      setAdminConfig(e.detail);
    }) as EventListener;
    
    window.addEventListener('admin-config-updated', handleConfigUpdate);
    return () => window.removeEventListener('admin-config-updated', handleConfigUpdate);
  }, []);
  
  // If optical workflow, show POS screen directly
  if (showPOS || adminConfig.features.salesWorkflow === 'optical') {
    return <OpticalPOSScreen onExit={() => setShowPOS(false)} />;
  }

  // For other workflows, show sales list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl">
            <Glasses className="h-6 w-6" />
            Sales & POS
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            Point of sale transactions
            <Badge variant="outline" className="text-xs">
              {adminConfig.features.salesWorkflow}
            </Badge>
            {adminConfig.features.salesWorkflow !== 'optical' && (
              <span className="text-xs text-amber-600">
                → Set to "optical" in Admin Portal for full POS
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search Sales
          </Button>
          <Button size="sm" onClick={() => setShowPOS(true)} className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Sale
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              {adminConfig.features.salesWorkflow === 'optical' 
                ? 'Latest optical sales activity'
                : 'Switch workflow to "optical" in Admin Portal for specialized optical POS'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Glasses className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">No sales recorded yet</p>
              {adminConfig.features.salesWorkflow !== 'optical' && (
                <p className="text-xs text-amber-600 mb-4">
                  💡 For full optical POS features, go to Admin Portal → Features → Sales Workflow → Optical
                </p>
              )}
              <Button 
                className="mt-4" 
                onClick={() => setShowPOS(true)}
                size="lg"
              >
                <Zap className="h-4 w-4 mr-2" />
                Start New Sale
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}