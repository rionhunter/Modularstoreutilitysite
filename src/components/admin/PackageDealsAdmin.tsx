import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Package, Plus, Edit, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { PackageDeal, DEFAULT_PACKAGES } from '../../types/packages';

export function PackageDealsAdmin() {
  const [packages, setPackages] = useState<PackageDeal[]>(() => {
    const saved = localStorage.getItem('optical-packages');
    return saved ? JSON.parse(saved) : DEFAULT_PACKAGES;
  });
  const [editingPackage, setEditingPackage] = useState<PackageDeal | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const savePackages = (updatedPackages: PackageDeal[]) => {
    setPackages(updatedPackages);
    localStorage.setItem('optical-packages', JSON.stringify(updatedPackages));
    window.dispatchEvent(new Event('packages-updated'));
  };

  const handleCreateNew = () => {
    const newPackage: PackageDeal = {
      id: Date.now().toString(),
      name: 'New Package',
      tier: 'standard',
      price: 299,
      description: '',
      active: true,
      includes: {
        lensType: 'single-vision',
        material: 'plastic',
        coatings: [],
        tintIncluded: false,
        warrantyMonths: 12,
        freeAdjustments: true,
        rushProcessing: false,
      },
      frameMaxValue: 200,
    };
    setEditingPackage(newPackage);
    setIsDialogOpen(true);
  };

  const handleEdit = (pkg: PackageDeal) => {
    setEditingPackage({ ...pkg });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingPackage) return;

    const existingIndex = packages.findIndex(p => p.id === editingPackage.id);
    let updatedPackages: PackageDeal[];
    
    if (existingIndex >= 0) {
      updatedPackages = [...packages];
      updatedPackages[existingIndex] = editingPackage;
    } else {
      updatedPackages = [...packages, editingPackage];
    }

    savePackages(updatedPackages);
    setIsDialogOpen(false);
    setEditingPackage(null);
    toast.success('Package saved successfully');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this package? This cannot be undone.')) {
      savePackages(packages.filter(p => p.id !== id));
      toast.success('Package deleted');
    }
  };

  const toggleActive = (id: string) => {
    const updatedPackages = packages.map(p =>
      p.id === id ? { ...p, active: !p.active } : p
    );
    savePackages(updatedPackages);
  };

  const availableCoatings = [
    'Scratch Resistant',
    'Anti-Reflective',
    'UV Protection',
    'Blue Light Filter',
    'Photochromic',
    'Mirror Coating',
    'Polarized',
  ];

  const tierColors = {
    basic: 'bg-slate-500',
    standard: 'bg-blue-500',
    premium: 'bg-purple-500',
    ultimate: 'bg-yellow-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl">
            <Package className="h-5 w-5" />
            Package Deals
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure bundled packages with preset features and pricing
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Package
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={!pkg.active ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-base">{pkg.name}</CardTitle>
                    {pkg.featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                  </div>
                  <Badge className={`${tierColors[pkg.tier]} text-white capitalize`}>
                    {pkg.tier}
                  </Badge>
                </div>
                <Switch
                  checked={pkg.active}
                  onCheckedChange={() => toggleActive(pkg.id)}
                />
              </div>
              <CardDescription className="text-xs mt-2">
                {pkg.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold">
                ${pkg.price}
              </div>
              
              <div className="text-xs space-y-1 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  <span className="capitalize">{pkg.includes.lensType.replace('-', ' ')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  <span>{pkg.includes.coatings.length} coating(s)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  <span>{pkg.includes.warrantyMonths} month warranty</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(pkg)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(pkg.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingPackage?.id && packages.find(p => p.id === editingPackage.id) ? 'Edit' : 'Create'} Package
            </DialogTitle>
          </DialogHeader>
          
          {editingPackage && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Package Name</Label>
                    <Input
                      value={editingPackage.name}
                      onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Tier</Label>
                    <Select
                      value={editingPackage.tier}
                      onValueChange={(value: any) => setEditingPackage({ ...editingPackage, tier: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="ultimate">Ultimate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    value={editingPackage.description}
                    onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Package Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingPackage.price}
                      onChange={(e) => setEditingPackage({ ...editingPackage, price: parseFloat(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Max Frame Value ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingPackage.frameMaxValue || ''}
                      onChange={(e) => setEditingPackage({ ...editingPackage, frameMaxValue: parseFloat(e.target.value) || undefined })}
                      placeholder="Unlimited"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3">Included Features</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Lens Type</Label>
                      <Select
                        value={editingPackage.includes.lensType}
                        onValueChange={(value: any) => setEditingPackage({
                          ...editingPackage,
                          includes: { ...editingPackage.includes, lensType: value }
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single-vision">Single Vision</SelectItem>
                          <SelectItem value="bifocal">Bifocal</SelectItem>
                          <SelectItem value="progressive">Progressive</SelectItem>
                          <SelectItem value="reading">Reading</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Lens Material</Label>
                      <Select
                        value={editingPackage.includes.material}
                        onValueChange={(value: any) => setEditingPackage({
                          ...editingPackage,
                          includes: { ...editingPackage.includes, material: value }
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plastic">Standard Plastic</SelectItem>
                          <SelectItem value="polycarbonate">Polycarbonate</SelectItem>
                          <SelectItem value="high-index">High Index</SelectItem>
                          <SelectItem value="trivex">Trivex</SelectItem>
                          <SelectItem value="glass">Glass</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label>Refractive Index</Label>
                    <Input
                      value={editingPackage.includes.index || ''}
                      onChange={(e) => setEditingPackage({
                        ...editingPackage,
                        includes: { ...editingPackage.includes, index: e.target.value }
                      })}
                      placeholder="e.g., 1.50, 1.59, 1.67"
                      className="mt-1"
                    />
                  </div>

                  <div className="mb-4">
                    <Label>Included Coatings</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availableCoatings.map((coating) => (
                        <div key={coating} className="flex items-center gap-2">
                          <Checkbox
                            id={`coating-${coating}`}
                            checked={editingPackage.includes.coatings.includes(coating)}
                            onCheckedChange={(checked) => {
                              const coatings = checked
                                ? [...editingPackage.includes.coatings, coating]
                                : editingPackage.includes.coatings.filter(c => c !== coating);
                              setEditingPackage({
                                ...editingPackage,
                                includes: { ...editingPackage.includes, coatings }
                              });
                            }}
                          />
                          <Label htmlFor={`coating-${coating}`} className="text-xs cursor-pointer">
                            {coating}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Warranty (months)</Label>
                      <Input
                        type="number"
                        value={editingPackage.includes.warrantyMonths}
                        onChange={(e) => setEditingPackage({
                          ...editingPackage,
                          includes: { ...editingPackage.includes, warrantyMonths: parseInt(e.target.value) || 0 }
                        })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <Label>Tint Included</Label>
                      <Switch
                        checked={editingPackage.includes.tintIncluded}
                        onCheckedChange={(checked) => setEditingPackage({
                          ...editingPackage,
                          includes: { ...editingPackage.includes, tintIncluded: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <Label>Free Adjustments</Label>
                      <Switch
                        checked={editingPackage.includes.freeAdjustments}
                        onCheckedChange={(checked) => setEditingPackage({
                          ...editingPackage,
                          includes: { ...editingPackage.includes, freeAdjustments: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <Label>Rush Processing</Label>
                      <Switch
                        checked={editingPackage.includes.rushProcessing}
                        onCheckedChange={(checked) => setEditingPackage({
                          ...editingPackage,
                          includes: { ...editingPackage.includes, rushProcessing: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <Label>Featured Package</Label>
                      <Switch
                        checked={editingPackage.featured || false}
                        onCheckedChange={(checked) => setEditingPackage({
                          ...editingPackage,
                          featured: checked
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    Save Package
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
