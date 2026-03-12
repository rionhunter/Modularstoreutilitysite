import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { 
  Settings, 
  Palette, 
  Package, 
  Upload,
  Save,
  RotateCcw,
  Eye,
  Briefcase,
  ShoppingCart,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Download,
  FileJson,
  LayoutDashboard
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getAdminConfig, saveAdminConfig, applyBranding } from '../utils/adminConfig';
import { AdminConfig, DEFAULT_BRANDING, DEFAULT_FEATURES } from '../types/admin';
import { PackageDealsAdmin } from './admin/PackageDealsAdmin';
import { Module } from '../types/modules';
import { ModuleBrowser } from './ModuleBrowser';
import { getModuleRegistry } from '../modules/registry';
import { Contact } from './ContactsPage';

export function AdminPortal({ modules, onModuleUpdate }: { modules: Module[]; onModuleUpdate: (modules: Module[]) => void }) {
  const [config, setConfig] = useState<AdminConfig>(getAdminConfig());
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const updateBranding = (updates: Partial<AdminConfig['branding']>) => {
    const newConfig = {
      ...config,
      branding: { ...config.branding, ...updates }
    };
    setConfig(newConfig);
    if (previewMode) {
      applyBranding(newConfig.branding);
    }
  };

  const updateFeatures = (updates: Partial<AdminConfig['features']>) => {
    const newConfig = {
      ...config,
      features: { ...config.features, ...updates }
    };
    setConfig(newConfig);
    
    // Auto-save immediately
    saveAdminConfig(newConfig);
    
    // Show feedback for workflow changes
    if (updates.salesWorkflow) {
      toast.success(`Sales workflow changed to: ${updates.salesWorkflow}`);
      if (updates.salesWorkflow === 'optical') {
        toast.info('Go to Sales tab to access the Optical POS', { duration: 5000 });
      }
    }
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'favicon'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (type === 'logo') {
        updateBranding({ logoUrl: base64 });
      } else {
        updateBranding({ faviconUrl: base64 });
      }
      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} uploaded`);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    saveAdminConfig(config);
    applyBranding(config.branding);
    toast.success('Configuration saved successfully');
    
    if (config.features.salesWorkflow === 'optical') {
      toast.info('Navigate to Sales tab to access Optical POS', { duration: 5000 });
    }
  };

  const handleReset = () => {
    if (confirm('Reset all settings to default? This cannot be undone.')) {
      const defaultConfig = {
        branding: DEFAULT_BRANDING,
        features: DEFAULT_FEATURES,
      };
      setConfig(defaultConfig);
      saveAdminConfig(defaultConfig);
      applyBranding(DEFAULT_BRANDING);
      toast.success('Configuration reset to defaults');
    }
  };

  const togglePreview = () => {
    if (!previewMode) {
      applyBranding(config.branding);
      setPreviewMode(true);
      toast.info('Preview mode enabled - changes apply in real-time');
    } else {
      const savedConfig = getAdminConfig();
      applyBranding(savedConfig.branding);
      setPreviewMode(false);
      toast.info('Preview mode disabled');
    }
  };

  const enabledFeaturesCount = Object.values(config.features).filter(
    v => typeof v === 'boolean' && v
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl">
            <Settings className="h-6 w-6" />
            Administrative Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure white-label branding and feature modules
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={previewMode ? 'default' : 'outline'}
            size="sm"
            onClick={togglePreview}
            className="flex-shrink-0"
          >
            <Eye className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{previewMode ? 'Previewing' : 'Preview'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} className="flex-shrink-0">
            <RotateCcw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button size="sm" onClick={handleSave} className="flex-shrink-0">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="modules">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="features">
            <Package className="h-4 w-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="trade">
            <Briefcase className="h-4 w-4 mr-2" />
            Trade Setup
          </TabsTrigger>
          <TabsTrigger value="packages">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Packages
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Identity</CardTitle>
              <CardDescription>
                Customize the name and visual branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="app-name">Application Name</Label>
                <Input
                  id="app-name"
                  value={config.branding.appName}
                  onChange={(e) => updateBranding({ appName: e.target.value })}
                  placeholder="Store Utility"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Logo</Label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                  {config.branding.logoUrl && (
                    <>
                      <img
                        src={config.branding.logoUrl}
                        alt="Logo preview"
                        className="h-16 border rounded object-contain bg-muted p-2"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateBranding({ logoUrl: undefined })}
                      >
                        Remove
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: PNG with transparent background, 200x60px
                </p>
              </div>

              <div>
                <Label>Favicon</Label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'favicon')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => faviconInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Favicon
                  </Button>
                  {config.branding.faviconUrl && (
                    <>
                      <img
                        src={config.branding.faviconUrl}
                        alt="Favicon preview"
                        className="h-8 w-8 border rounded"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateBranding({ faviconUrl: undefined })}
                      >
                        Remove
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 32x32px or 64x64px
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Theme Colors</CardTitle>
              <CardDescription>
                Customize the application color palette
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={config.branding.primaryColor}
                      onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={config.branding.primaryColor}
                      onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={config.branding.secondaryColor}
                      onChange={(e) => updateBranding({ secondaryColor: e.target.value })}
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={config.branding.secondaryColor}
                      onChange={(e) => updateBranding({ secondaryColor: e.target.value })}
                      placeholder="#8b5cf6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={config.branding.accentColor}
                      onChange={(e) => updateBranding({ accentColor: e.target.value })}
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={config.branding.accentColor}
                      onChange={(e) => updateBranding({ accentColor: e.target.value })}
                      placeholder="#06b6d4"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dark Mode Default</Label>
                    <p className="text-xs text-muted-foreground">
                      Set the default appearance mode
                    </p>
                  </div>
                  <Switch
                    checked={config.branding.darkMode}
                    onCheckedChange={(checked) => updateBranding({ darkMode: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Module Browser</CardTitle>
              <CardDescription>
                Browse and manage available modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModuleBrowser
                modules={modules}
                onModuleUpdate={onModuleUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Core Modules</CardTitle>
                  <CardDescription>
                    Enable or disable core functionality modules
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {enabledFeaturesCount} Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  <FeatureToggle
                    label="Cash Calculator"
                    description="End-of-day banking with denomination counting"
                    checked={config.features.cashCalculator}
                    onChange={(checked) => updateFeatures({ cashCalculator: checked })}
                  />
                  
                  <FeatureToggle
                    label="Balance Calculator"
                    description="Two-column balance reconciliation tool"
                    checked={config.features.balanceCalculator}
                    onChange={(checked) => updateFeatures({ balanceCalculator: checked })}
                  />
                  
                  <FeatureToggle
                    label="Task Tracker"
                    description="Task management with scheduling and alerts"
                    checked={config.features.taskTracker}
                    onChange={(checked) => updateFeatures({ taskTracker: checked })}
                  />
                  
                  <FeatureToggle
                    label="Quick Quote"
                    description="Generate customer quotes and estimates"
                    checked={config.features.quickQuote}
                    onChange={(checked) => updateFeatures({ quickQuote: checked })}
                  />
                  
                  <FeatureToggle
                    label="Stock Tracker"
                    description="Inventory tracking with location management"
                    checked={config.features.stockTracker}
                    onChange={(checked) => updateFeatures({ stockTracker: checked })}
                  />
                  
                  <FeatureToggle
                    label="Contacts"
                    description="Customer and supplier contact management"
                    checked={config.features.contacts}
                    onChange={(checked) => updateFeatures({ contacts: checked })}
                  />
                  
                  <FeatureToggle
                    label="Documents"
                    description="PDF templates and document resource management"
                    checked={config.features.documents}
                    onChange={(checked) => updateFeatures({ documents: checked })}
                  />
                  
                  <FeatureToggle
                    label="Specials"
                    description="Promotional offers and discount tracking"
                    checked={config.features.specials}
                    onChange={(checked) => updateFeatures({ specials: checked })}
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Features</CardTitle>
              <CardDescription>
                Additional functionality for enhanced workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FeatureToggle
                  label="Store Layout Designer"
                  description="Visual bay configuration for physical store mapping"
                  checked={config.features.storeLayout}
                  onChange={(checked) => updateFeatures({ storeLayout: checked })}
                />
                
                <FeatureToggle
                  label="Stock Take"
                  description="Barcode scanning for inventory audits"
                  checked={config.features.stockTake}
                  onChange={(checked) => updateFeatures({ stockTake: checked })}
                />
                
                <FeatureToggle
                  label="Sales / POS"
                  description="Point of sale and sales transaction processing"
                  checked={config.features.sales}
                  onChange={(checked) => updateFeatures({ sales: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trade Setup Tab */}
        <TabsContent value="trade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Sales Workflow Configuration
              </CardTitle>
              <CardDescription>
                Configure trade-specific sales and POS workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="sales-workflow">Sales Workflow Type</Label>
                <Select
                  value={config.features.salesWorkflow}
                  onValueChange={(value: any) => updateFeatures({ salesWorkflow: value })}
                  disabled={!config.features.sales}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Retail</SelectItem>
                    <SelectItem value="optical">Optical / Eyewear</SelectItem>
                    <SelectItem value="automotive">Automotive</SelectItem>
                    <SelectItem value="bookstore">Bookstore</SelectItem>
                    <SelectItem value="custom">Custom Workflow</SelectItem>
                  </SelectContent>
                </Select>
                {!config.features.sales && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Enable "Sales / POS" in the Features tab to configure workflows
                  </p>
                )}
              </div>

              {config.features.sales && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <h4 className="text-sm font-medium">
                    {config.features.salesWorkflow === 'optical' && 'Optical Workflow Features'}
                    {config.features.salesWorkflow === 'automotive' && 'Automotive Workflow Features'}
                    {config.features.salesWorkflow === 'bookstore' && 'Bookstore Workflow Features'}
                    {config.features.salesWorkflow === 'general' && 'General Retail Features'}
                    {config.features.salesWorkflow === 'custom' && 'Custom Workflow'}
                  </h4>
                  
                  <div className="text-sm text-muted-foreground space-y-2">
                    {config.features.salesWorkflow === 'optical' && (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Patient information and medical claims
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Prescription details (SPH, CYL, AXIS, ADD, PD)
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Frame selection and measurements
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Lens type, coating, tint options
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Fitting measurements (DBL, ED, B)
                        </div>
                      </>
                    )}
                    
                    {config.features.salesWorkflow === 'automotive' && (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Vehicle identification (VIN, make, model, year)
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Service history tracking
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Parts and labor breakdown
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Warranty and registration management
                        </div>
                      </>
                    )}
                    
                    {config.features.salesWorkflow === 'bookstore' && (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          ISBN lookup and cataloging
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Author and publisher tracking
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Condition grading (new, used, collectible)
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Special orders and reservations
                        </div>
                      </>
                    )}
                    
                    {config.features.salesWorkflow === 'general' && (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Basic customer information
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Product selection and pricing
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Payment processing
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Receipt generation
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="trade-type">Trade / Industry Type</Label>
                <Input
                  id="trade-type"
                  value={config.tradeType || ''}
                  onChange={(e) => setConfig({ ...config, tradeType: e.target.value })}
                  placeholder="e.g., Optical Retail, Auto Parts, Bookstore"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Specify your business type for better customization
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Package Deals Tab */}
        <TabsContent value="packages" className="space-y-4">
          <PackageDealsAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeatureToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-3 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Label className="cursor-pointer">{label}</Label>
          {checked && <Badge variant="secondary" className="text-xs">Enabled</Badge>}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}