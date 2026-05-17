import { useState } from 'react';
import { Module } from '../types/modules';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Download, Upload, FileJson, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Contact } from './ContactsPage';

interface ModuleBrowserProps {
  modules: Module[];
  onModuleUpdate: (modules: Module[]) => void;
}

export function ModuleBrowser({ modules, onModuleUpdate }: ModuleBrowserProps) {
  const [localModules, setLocalModules] = useState(modules);

  const handleToggle = (id: string) => {
    const updated = localModules.map(mod =>
      mod.id === id ? { ...mod, enabled: !mod.enabled } : mod
    );
    setLocalModules(updated);
    onModuleUpdate(updated);
  };

  const moveModule = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === localModules.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...localModules];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    
    // Update order property
    const reordered = updated.map((mod, idx) => ({ ...mod, order: idx }));
    setLocalModules(reordered);
    onModuleUpdate(reordered);
    toast.success('Module order updated');
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
    <div className="space-y-6">
      {/* Dashboard Modules */}
      <div>
        <h3 className="text-sm font-medium mb-3">Dashboard Modules</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Configure which modules appear on your dashboard and their order
        </p>
        <div className="space-y-2">
          {localModules.map((module, index) => (
            <div
              key={module.id}
              className="flex items-center gap-2 p-3 border rounded-lg bg-background"
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveModule(index, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-muted rounded disabled:opacity-30"
                >
                  <GripVertical className="h-3 w-3" />
                </button>
                <button
                  onClick={() => moveModule(index, 'down')}
                  disabled={index === localModules.length - 1}
                  className="p-1 hover:bg-muted rounded disabled:opacity-30"
                >
                  <GripVertical className="h-3 w-3" />
                </button>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label className="cursor-pointer">{module.title}</Label>
                  {module.enabled && (
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {module.description}
                </p>
              </div>
              
              <Switch
                checked={module.enabled}
                onCheckedChange={() => handleToggle(module.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="pt-6 border-t">
        <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
          <FileJson className="h-4 w-4" />
          Data Management
        </h3>
        <div className="space-y-4">
          <div>
            <Label>Contacts</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Export or import your contacts in JSON format
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportContacts}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={importContacts}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
