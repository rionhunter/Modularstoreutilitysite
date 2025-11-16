import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Plus, Search, Download, Package, Info } from 'lucide-react';
import { ModuleDefinition } from '../types/module-system';
import { toast } from 'sonner@2.0.3';

interface ModuleBrowserProps {
  availableModules: ModuleDefinition[];
  installedModuleIds: string[];
  onInstall: (moduleId: string) => void;
}

export function ModuleBrowser({
  availableModules,
  installedModuleIds,
  onInstall,
}: ModuleBrowserProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Modules' },
    { id: 'finance', label: 'Finance' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'utility', label: 'Utility' },
    { id: 'custom', label: 'Custom' },
  ];

  const filteredModules = availableModules.filter(module => {
    const matchesSearch =
      module.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.metadata.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.metadata.tags?.some(tag =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === 'all' || module.metadata.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleInstall = (moduleId: string) => {
    onInstall(moduleId);
    toast.success('Module installed successfully', {
      description: 'The module has been added to your dashboard',
    });
  };

  const isInstalled = (moduleId: string) => {
    return installedModuleIds.includes(moduleId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Module Browser</DialogTitle>
          <DialogDescription>
            Browse and install modules to customize your dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search modules..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Categories */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6">
              {categories.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map(cat => (
              <TabsContent key={cat.id} value={cat.id}>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredModules.length === 0 ? (
                      <div className="col-span-2 text-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No modules found</p>
                      </div>
                    ) : (
                      filteredModules.map(module => {
                        const Icon = module.metadata.icon || Package;
                        const installed = isInstalled(module.metadata.id);

                        return (
                          <Card key={module.metadata.id}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <Icon className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-base">
                                      {module.metadata.title}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                      v{module.metadata.version}
                                      {module.metadata.author && ` • ${module.metadata.author}`}
                                    </CardDescription>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <p className="text-sm text-muted-foreground">
                                {module.metadata.description}
                              </p>

                              {/* Tags */}
                              {module.metadata.tags && module.metadata.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {module.metadata.tags.slice(0, 3).map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {/* Install Button */}
                              <Button
                                className="w-full"
                                size="sm"
                                onClick={() => handleInstall(module.metadata.id)}
                                disabled={installed}
                              >
                                {installed ? (
                                  <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Installed
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Install
                                  </>
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm">
                <strong>Custom Modules:</strong> You can create custom modules by following
                the module standard specification.
              </p>
              <p className="text-xs text-muted-foreground">
                Future updates will support importing custom modules from files or URLs.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
