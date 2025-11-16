import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Module } from '../types/modules';
import { Settings, Download, Upload, FileJson } from 'lucide-react';
import { ModuleBrowser } from './ModuleBrowser';
import { getModuleRegistry } from '../modules/registry';
import { toast } from 'sonner@2.0.3';
import { Contact } from './ContactsPage';

interface ModuleSettingsProps {
  modules: Module[];
  onUpdate: (modules: Module[]) => void;
}

export function ModuleSettings({ modules, onUpdate }: ModuleSettingsProps) {
  const [open, setOpen] = useState(false);
  const [localModules, setLocalModules] = useState(modules);
  const registry = getModuleRegistry();

  const handleToggle = (id: string) => {
    setLocalModules(prev =>
      prev.map(mod =>
        mod.id === id ? { ...mod, enabled: !mod.enabled } : mod
      )
    );
  };

  const handleInstallModule = (moduleId: string) => {
    const definition = registry.get(moduleId);
    if (!definition) {
      toast.error('Module not found');
      return;
    }

    // Check if module already exists
    if (localModules.some(m => m.id === moduleId)) {
      toast.info('Module already installed');
      return;
    }

    const newModule: Module = {
      id: moduleId as any,
      title: definition.metadata.title,
      description: definition.metadata.description,
      enabled: true,
      order: localModules.length,
    };

    setLocalModules(prev => [...prev, newModule]);
    toast.success(`${definition.metadata.title} installed`);
  };

  const handleSave = () => {
    onUpdate(localModules);
    setOpen(false);
  };

  const exportContacts = () => {
    const contacts = localStorage.getItem('contacts');
    if (!contacts) {
      toast.error('No contacts to export');
      return;
    }

    const dataStr = JSON.stringify(JSON.parse(contacts), null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Contacts exported successfully');
  };

  const importContacts = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedContacts = JSON.parse(event.target?.result as string);
          
          // Validate that it's an array
          if (!Array.isArray(importedContacts)) {
            toast.error('Invalid contacts file format');
            return;
          }

          // Merge with existing contacts, avoiding duplicates by ID
          const existingContacts = localStorage.getItem('contacts');
          const existing: Contact[] = existingContacts ? JSON.parse(existingContacts) : [];
          const existingIds = new Set(existing.map(c => c.id));
          
          const newContacts = importedContacts.filter((c: Contact) => !existingIds.has(c.id));
          const merged = [...existing, ...newContacts];
          
          localStorage.setItem('contacts', JSON.stringify(merged));
          window.dispatchEvent(new Event('contacts-updated'));
          
          toast.success(`Imported ${newContacts.length} new contacts (${importedContacts.length - newContacts.length} duplicates skipped)`);
        } catch (error) {
          toast.error('Failed to import contacts. Please check the file format.');
          console.error(error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-9 w-9"
      >
        <Settings className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Settings</DialogTitle>
                <DialogDescription>
                  Manage modules and data
                </DialogDescription>
              </div>
              <ModuleBrowser
                availableModules={registry.getAll()}
                installedModuleIds={localModules.map(m => m.id)}
                onInstall={handleInstallModule}
              />
            </div>
          </DialogHeader>

          {/* Module Settings */}
          <div className="space-y-4 py-4 border-b">
            <h3 className="flex items-center gap-2">
              Dashboard Modules
            </h3>
            {localModules.map(module => (
              <div
                key={module.id}
                className="flex items-start justify-between space-x-4"
              >
                <div className="flex-1 space-y-1">
                  <Label htmlFor={module.id}>{module.title}</Label>
                  <p className="text-sm text-muted-foreground">
                    {module.description}
                  </p>
                </div>
                <Switch
                  id={module.id}
                  checked={module.enabled}
                  onCheckedChange={() => handleToggle(module.id)}
                />
              </div>
            ))}
          </div>

          {/* Data Management */}
          <div className="space-y-4 py-4">
            <h3 className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Data Management
            </h3>
            <div className="space-y-2">
              <Label>Contacts</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Export or import your contacts in JSON format
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={exportContacts}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  onClick={importContacts}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
