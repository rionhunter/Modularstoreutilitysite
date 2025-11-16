# Modular Dashboard System

## Architecture Overview

This dashboard implements a comprehensive modular architecture that allows for:

1. **Dynamic Module Management**: Add, remove, enable, and disable modules at runtime
2. **Standardized Interface**: All modules follow a consistent interface for seamless integration
3. **Configuration System**: Each module can define its own configurable settings
4. **Registry Pattern**: Central module registry for discovery and management
5. **Lifecycle Hooks**: Modules can respond to installation, uninstallation, and state changes

## Key Components

### 1. Module System Types (`/types/module-system.ts`)

Core type definitions and classes:

- **ModuleDefinition**: Complete specification for a module
- **ModuleMetadata**: Module information (id, version, title, description, category, etc.)
- **ModuleComponentProps**: Standard props passed to all module components
- **ModuleConfigSchema**: Schema for module configuration options
- **InstalledModule**: Represents an installed instance of a module
- **ModuleRegistry**: Singleton registry for all available modules
- **ModuleStorageManager**: Handles persistence of installed modules
- **ModuleUtils**: Utility functions for validation and config merging

### 2. Module Registry (`/modules/registry.ts`)

Central registration system:

- **CORE_MODULES**: Array of built-in module definitions
- **initializeModuleRegistry()**: Initializes registry with core modules
- **getModuleRegistry()**: Returns the registry singleton instance

All core modules are registered here with full metadata, configuration schemas, and default settings.

### 3. Module Management Hook (`/hooks/useModules.ts`)

React hook for module management:

```typescript
const {
  installedModules,      // Currently installed modules
  availableModules,      // All modules in registry
  installModule,         // Install a new module
  uninstallModule,       // Remove a module
  updateModule,          // Update module config
  enableModule,          // Enable a disabled module
  disableModule,         // Disable a module
  reorderModules,        // Change module order
  getModuleDefinition,   // Get module from registry
  getInstalledModule,    // Get installed instance
} = useModules();
```

### 4. Module Browser (`/components/ModuleBrowser.tsx`)

UI for browsing and installing modules:

- Search functionality
- Category filtering
- Module preview cards
- Installation status tracking
- Future: Support for external module imports

### 5. Module Settings (`/components/ModuleSettings.tsx`)

UI for managing installed modules:

- Enable/disable modules
- Access to module browser
- Future: Per-module configuration UI

## Module Lifecycle

### Installation Flow

1. User clicks "Add Module" in settings
2. ModuleBrowser displays available modules
3. User selects module and clicks "Install"
4. `installModule()` is called with moduleId
5. New InstalledModule instance is created
6. Module's `onInstall` hook is called (if defined)
7. Module is added to installedModules array
8. Module appears on dashboard

### Enabling/Disabling

1. User toggles module in settings
2. `enableModule()` or `disableModule()` is called
3. Module's `onEnable` or `onDisable` hook is called
4. Module state is updated
5. Dashboard re-renders to show/hide module

### Uninstallation

1. User removes module (future feature)
2. `uninstallModule()` is called
3. Module's `onUninstall` hook is called
4. Module data can be cleaned up
5. Module is removed from installedModules

## Creating a New Module

### Step 1: Create Module Component

```typescript
// /components/modules/MyModule.tsx
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ModuleComponentProps } from '../../types/module-system';

export function MyModule({ config }: ModuleComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Module</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Config value: {config?.myOption}</p>
      </CardContent>
    </Card>
  );
}
```

### Step 2: Register in Registry

```typescript
// /modules/registry.ts
import { MyModule } from '../components/modules/MyModule';
import { MyIcon } from 'lucide-react';

export const CORE_MODULES: ModuleDefinition[] = [
  // ... existing modules
  {
    metadata: {
      id: 'my-module',
      version: '1.0.0',
      title: 'My Module',
      description: 'Does something useful',
      category: 'utility',
      icon: MyIcon,
      tags: ['custom'],
      configSchema: {
        fields: [
          {
            key: 'myOption',
            label: 'My Option',
            type: 'text',
            defaultValue: 'default',
          },
        ],
      },
      defaultConfig: {
        myOption: 'default',
      },
    },
    component: MyModule,
  },
];
```

### Step 3: Add to Type Definitions (if using old Module type)

```typescript
// /types/modules.ts
export type ModuleType = 
  | 'cash-calculator'
  | 'my-module'  // Add your module ID
  | ...
```

### Step 4: Update BentoDashboard (if not using dynamic rendering)

```typescript
// /components/BentoDashboard.tsx
case 'my-module':
  return <MyModule />;
```

## Migration Path

The system is designed to gradually migrate from the old static module system to the new dynamic system:

### Current State (Hybrid)

- Old `Module` type in `/types/modules.ts` for backwards compatibility
- New `ModuleDefinition` system for extensibility
- Registry initialized but not yet fully integrated with dashboard
- Module browser available but using compatibility layer

### Future State (Fully Dynamic)

- Remove static module switch statement
- Use registry-based rendering
- Support external module imports
- Module configuration UI
- Module marketplace

## Configuration System

### Defining Configuration Schema

```typescript
configSchema: {
  fields: [
    {
      key: 'currency',
      label: 'Currency',
      type: 'select',
      defaultValue: 'USD',
      options: [
        { label: 'USD ($)', value: 'USD' },
        { label: 'EUR (€)', value: 'EUR' },
      ],
      description: 'Select currency',
    },
    {
      key: 'threshold',
      label: 'Alert Threshold',
      type: 'number',
      defaultValue: 10,
      min: 1,
      max: 100,
    },
    {
      key: 'enabled',
      label: 'Enable Feature',
      type: 'boolean',
      defaultValue: true,
    },
  ],
}
```

### Using Configuration in Component

```typescript
export function MyModule({ config, onConfigChange }: ModuleComponentProps) {
  const currency = config?.currency || 'USD';
  const threshold = config?.threshold || 10;
  
  const handleUpdate = (key: string, value: any) => {
    onConfigChange?.({ ...config, [key]: value });
  };
  
  return (
    // Use config values
  );
}
```

## Persistence

### Storage Keys

- `installed-modules`: Array of InstalledModule instances
- `store-modules`: Legacy module storage (backwards compatibility)

### Storage Format

```json
{
  "installed-modules": [
    {
      "id": "cash-calculator-1234567890-xyz",
      "moduleId": "cash-calculator",
      "title": "Cash Calculator",
      "enabled": true,
      "order": 0,
      "config": {
        "currency": "USD",
        "defaultFloat": 100
      },
      "installedAt": "2024-11-12T10:00:00.000Z",
      "updatedAt": "2024-11-12T10:00:00.000Z"
    }
  ]
}
```

## Best Practices

### Module Design

1. **Self-Contained**: Modules should not depend on other modules' state
2. **Configurable**: Use config schema for user-adjustable options
3. **Responsive**: Use responsive CSS classes for all screen sizes
4. **Accessible**: Follow accessibility guidelines (labels, ARIA attributes)
5. **Performant**: Lazy load data, use React.memo for expensive components

### State Management

1. **Local State**: Use useState for UI state
2. **Persistent State**: Use localStorage for data that should persist
3. **Configuration**: Use config prop for user settings
4. **Side Effects**: Use useEffect with proper dependencies

### Error Handling

1. **Validation**: Validate user input before processing
2. **Feedback**: Use toast notifications for success/error messages
3. **Graceful Degradation**: Handle missing data gracefully
4. **Logging**: Use console.error for debugging (removed in production)

## Testing

### Module Validation

```typescript
import { ModuleUtils } from '../types/module-system';

const validation = ModuleUtils.validate(myModuleDefinition);
if (!validation.valid) {
  console.error('Module validation failed:', validation.errors);
}
```

### Integration Testing

1. Register module in registry
2. Install module via useModules hook
3. Verify module appears on dashboard
4. Test configuration changes
5. Test enable/disable
6. Test uninstall

## Future Enhancements

### Planned Features

1. **Dynamic Imports**: Load modules from external URLs or files
2. **Module Marketplace**: Browse and download community modules
3. **Version Management**: Handle module updates and compatibility
4. **Dependencies**: Automatic installation of required modules
5. **Sandboxing**: Security layer for untrusted modules
6. **Module Builder**: Visual tool for creating modules without code
7. **Export/Import**: Share module configurations
8. **Analytics**: Track module usage and performance

### Security Considerations

When implementing dynamic imports:

- Code validation and sanitization
- Permission system for sensitive operations
- Sandboxed execution environment
- Digital signatures for verification
- Community review process

## API Reference

See `/types/module-system.ts` for complete type definitions and API documentation.

## Examples

See `/MODULE_STANDARD.md` for complete examples and module creation guide.

## Support

For questions, issues, or contributions, please refer to the repository documentation.
