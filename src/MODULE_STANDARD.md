# Dashboard Module Standard

## Overview

The Modular Store Utility Dashboard follows a standardized module architecture that allows developers to create, share, and integrate custom modules seamlessly. This document outlines the specification that all modules must follow.

## Module Definition Structure

Every module must conform to the `ModuleDefinition` interface:

```typescript
interface ModuleDefinition {
  metadata: ModuleMetadata;
  component: ComponentType<ModuleComponentProps>;
  settingsComponent?: ComponentType<ModuleComponentProps>;
  previewComponent?: ComponentType<ModuleComponentProps>;
  onInstall?: () => void | Promise<void>;
  onUninstall?: () => void | Promise<void>;
  onEnable?: () => void | Promise<void>;
  onDisable?: () => void | Promise<void>;
}
```

## Module Metadata

### Required Fields

- **id**: Unique identifier (kebab-case, e.g., "my-custom-module")
- **version**: Semantic version (e.g., "1.0.0")
- **title**: Human-readable module name
- **description**: Brief description of module functionality
- **category**: One of: 'finance' | 'inventory' | 'productivity' | 'utility' | 'custom'

### Optional Fields

- **author**: Module creator name
- **icon**: Lucide icon component
- **tags**: Array of searchable keywords
- **dependencies**: Array of module IDs this module depends on
- **configSchema**: Schema defining configurable options
- **defaultConfig**: Default configuration values

## Component Interface

All module components receive standardized props:

```typescript
interface ModuleComponentProps {
  config?: Record<string, any>;
  onConfigChange?: (config: Record<string, any>) => void;
  isEditing?: boolean;
}
```

## Configuration Schema

Modules can define configurable settings using a schema:

```typescript
interface ModuleConfigSchema {
  fields: ModuleConfigField[];
}

interface ModuleConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'color' | 'textarea';
  defaultValue: any;
  options?: Array<{ label: string; value: any }>;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
}
```

## Creating a Custom Module

### Step 1: Define Module Metadata

```typescript
import { ModuleDefinition } from '../types/module-system';
import { MyIcon } from 'lucide-react';

const myModuleDefinition: ModuleDefinition = {
  metadata: {
    id: 'my-custom-module',
    version: '1.0.0',
    title: 'My Custom Module',
    description: 'Does something awesome',
    category: 'custom',
    icon: MyIcon,
    tags: ['custom', 'example'],
    configSchema: {
      fields: [
        {
          key: 'myOption',
          label: 'My Option',
          type: 'text',
          defaultValue: 'default value',
          description: 'Configure my option',
        },
      ],
    },
    defaultConfig: {
      myOption: 'default value',
    },
  },
  component: MyModuleComponent,
};
```

### Step 2: Create Module Component

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ModuleComponentProps } from '../types/module-system';

export function MyModuleComponent({ config, onConfigChange }: ModuleComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Custom Module</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Option value: {config?.myOption}</p>
        {/* Your module UI here */}
      </CardContent>
    </Card>
  );
}
```

### Step 3: Register Module

```typescript
import { getModuleRegistry } from '../modules/registry';

// Register your module
const registry = getModuleRegistry();
registry.register(myModuleDefinition);
```

## Module Lifecycle Hooks

Modules can implement lifecycle hooks for side effects:

### onInstall
Called when a module is first installed to the dashboard.

```typescript
onInstall: () => {
  console.log('Module installed');
  // Initialize any required resources
}
```

### onUninstall
Called when a module is removed from the dashboard.

```typescript
onUninstall: () => {
  console.log('Module uninstalled');
  // Clean up resources
}
```

### onEnable
Called when a disabled module is enabled.

```typescript
onEnable: () => {
  console.log('Module enabled');
}
```

### onDisable
Called when an enabled module is disabled.

```typescript
onDisable: () => {
  console.log('Module disabled');
}
```

## Best Practices

### 1. Use ShadCN UI Components
Always use the pre-configured ShadCN components from `/components/ui` for consistent styling:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
```

### 2. Manage State Properly
Use React hooks for state management. For persistent data, use localStorage:

```typescript
const [data, setData] = useState(() => {
  const saved = localStorage.getItem('my-module-data');
  return saved ? JSON.parse(saved) : [];
});

useEffect(() => {
  localStorage.setItem('my-module-data', JSON.stringify(data));
}, [data]);
```

### 3. Respect Configuration
Always use the provided config prop and call onConfigChange when config should update:

```typescript
const handleSettingChange = (key: string, value: any) => {
  onConfigChange?.({ ...config, [key]: value });
};
```

### 4. Handle Loading States
Show appropriate loading states for async operations:

```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    // Async operation
  } finally {
    setLoading(false);
  }
};
```

### 5. Use Toast for Feedback
Provide user feedback with the Sonner toast system:

```typescript
import { toast } from 'sonner@2.0.3';

toast.success('Action completed');
toast.error('Something went wrong');
```

### 6. Keep Modules Self-Contained
Modules should be as independent as possible. Avoid tight coupling with other modules.

### 7. Validate User Input
Always validate and sanitize user input:

```typescript
const validateInput = (value: string) => {
  if (!value.trim()) {
    toast.error('Input cannot be empty');
    return false;
  }
  return true;
};
```

## Module Categories

### Finance
Modules dealing with money, transactions, banking, calculations, and financial tracking.

### Inventory
Modules for stock management, warehouse operations, product tracking, and location management.

### Productivity
Modules for task management, scheduling, reminders, and workflow optimization.

### Utility
General-purpose tools like calculators, converters, and helper functions.

### Custom
User-created modules that don't fit into predefined categories.

## Example: Complete Module

```typescript
import { useState } from 'react';
import { ModuleDefinition, ModuleComponentProps } from '../types/module-system';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Timer } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// Component
function TimerModule({ config }: ModuleComponentProps) {
  const [seconds, setSeconds] = useState(config?.defaultSeconds || 60);
  const [running, setRunning] = useState(false);

  React.useEffect(() => {
    if (!running) return;
    
    const interval = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          setRunning(false);
          toast.success('Timer finished!');
          return config?.defaultSeconds || 60;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, config]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-4xl font-mono text-center">
          {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setRunning(!running)}
            className="flex-1"
          >
            {running ? 'Pause' : 'Start'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setRunning(false);
              setSeconds(config?.defaultSeconds || 60);
            }}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Definition
export const timerModule: ModuleDefinition = {
  metadata: {
    id: 'timer',
    version: '1.0.0',
    title: 'Timer',
    description: 'Simple countdown timer',
    category: 'utility',
    icon: Timer,
    tags: ['timer', 'countdown', 'utility'],
    configSchema: {
      fields: [
        {
          key: 'defaultSeconds',
          label: 'Default Duration (seconds)',
          type: 'number',
          defaultValue: 60,
          min: 1,
          max: 3600,
        },
      ],
    },
    defaultConfig: {
      defaultSeconds: 60,
    },
  },
  component: TimerModule,
};
```

## Future Features

- **Dynamic Module Loading**: Import modules from external files or URLs
- **Module Marketplace**: Browse and download community-created modules
- **Module Dependencies**: Automatically install required dependencies
- **Version Management**: Update modules and maintain compatibility
- **Module Sandboxing**: Security layer for untrusted modules
- **Module Templates**: Starter templates for common module types

## Security Considerations

When implementing dynamic module loading:

1. **Code Validation**: Validate module code before execution
2. **Sandboxing**: Run modules in isolated contexts
3. **Permission System**: Request explicit permissions for sensitive operations
4. **Code Review**: Community modules should be reviewed before publication
5. **Signature Verification**: Verify module authenticity with digital signatures

## Support

For questions, issues, or contributions to the module system, please refer to the main repository documentation.
