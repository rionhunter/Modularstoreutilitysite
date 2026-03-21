import { ReactNode, ComponentType } from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * Module Configuration Schema
 * Defines the structure for module-specific settings
 */
export interface ModuleConfigField {
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

export interface ModuleConfigSchema {
  fields: ModuleConfigField[];
}

/**
 * Module Metadata
 * Core information about a module
 */
export interface ModuleMetadata {
  id: string;
  version: string;
  title: string;
  description: string;
  author?: string;
  category: 'finance' | 'inventory' | 'productivity' | 'utility' | 'custom';
  icon?: LucideIcon;
  tags?: string[];
  dependencies?: string[]; // IDs of other modules this depends on
  configSchema?: ModuleConfigSchema;
  defaultConfig?: Record<string, any>;
}

/**
 * Module Component Props
 * Standard props passed to all module components
 */
export interface ModuleComponentProps {
  config?: Record<string, any>;
  onConfigChange?: (config: Record<string, any>) => void;
  isEditing?: boolean;
}

/**
 * Module Definition
 * Complete module specification
 */
export interface ModuleDefinition {
  metadata: ModuleMetadata;
  component: ComponentType<ModuleComponentProps>;
  settingsComponent?: ComponentType<ModuleComponentProps>; // Custom settings UI
  previewComponent?: ComponentType<ModuleComponentProps>; // Preview for module selection
  onInstall?: () => void | Promise<void>; // Hook called when module is installed
  onUninstall?: () => void | Promise<void>; // Hook called when module is uninstalled
  onEnable?: () => void | Promise<void>; // Hook called when module is enabled
  onDisable?: () => void | Promise<void>; // Hook called when module is disabled
}

/**
 * Installed Module Instance
 * Represents an installed and configured module
 */
export interface InstalledModule {
  id: string; // Unique instance ID (allows multiple instances of same module)
  moduleId: string; // Reference to ModuleDefinition ID
  title?: string; // Custom title override
  enabled: boolean;
  order: number;
  config: Record<string, any>;
  installedAt: Date;
  updatedAt: Date;
}

/**
 * Module Registry
 * Central store for all available modules
 */
export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private modules: Map<string, ModuleDefinition> = new Map();

  private constructor() {}

  public static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  /**
   * Register a new module
   */
  public register(definition: ModuleDefinition): void {
    if (this.modules.has(definition.metadata.id)) {
      console.warn(`Module ${definition.metadata.id} is already registered. Overwriting...`);
    }
    this.modules.set(definition.metadata.id, definition);
  }

  /**
   * Unregister a module
   */
  public unregister(moduleId: string): void {
    this.modules.delete(moduleId);
  }

  /**
   * Get a module definition
   */
  public get(moduleId: string): ModuleDefinition | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Get all registered modules
   */
  public getAll(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get modules by category
   */
  public getByCategory(category: string): ModuleDefinition[] {
    return this.getAll().filter(m => m.metadata.category === category);
  }

  /**
   * Check if a module is registered
   */
  public has(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }

  /**
   * Get module count
   */
  public count(): number {
    return this.modules.size;
  }

  /**
   * Import a module from external source
   * This would be used for dynamic module loading
   */
  public async importModule(moduleCode: string): Promise<ModuleDefinition> {
    // In a real implementation, this would:
    // 1. Validate the module code
    // 2. Check for security issues
    // 3. Dynamically load the module
    // 4. Register it
    // For now, this is a placeholder
    throw new Error('Dynamic module import not yet implemented');
  }
}

/**
 * Module Storage Manager
 * Handles persistence of installed modules
 */
export class ModuleStorageManager {
  private static STORAGE_KEY = 'installed-modules';

  /**
   * Save installed modules to localStorage
   */
  public static save(modules: InstalledModule[]): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(modules.map(m => ({
          ...m,
          installedAt: m.installedAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        })))
      );
    } catch (error) {
      console.error('Failed to save modules:', error);
    }
  }

  /**
   * Load installed modules from localStorage
   */
  public static load(): InstalledModule[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return parsed.map((m: any) => ({
        ...m,
        installedAt: new Date(m.installedAt),
        updatedAt: new Date(m.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to load modules:', error);
      return [];
    }
  }

  /**
   * Clear all installed modules
   */
  public static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

/**
 * Module Utilities
 */
export class ModuleUtils {
  /**
   * Validate module definition
   */
  public static validate(definition: ModuleDefinition): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!definition.metadata.id) {
      errors.push('Module ID is required');
    }

    if (!definition.metadata.version) {
      errors.push('Module version is required');
    }

    if (!definition.metadata.title) {
      errors.push('Module title is required');
    }

    if (!definition.component) {
      errors.push('Module component is required');
    }

    if (definition.metadata.configSchema) {
      definition.metadata.configSchema.fields.forEach((field, index) => {
        if (!field.key) {
          errors.push(`Config field at index ${index} missing key`);
        }
        if (!field.label) {
          errors.push(`Config field ${field.key} missing label`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate a unique instance ID
   */
  public static generateInstanceId(moduleId: string): string {
    return `${moduleId}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Merge config with defaults
   */
  public static mergeConfig(
    defaults: Record<string, any> = {},
    config: Record<string, any> = {}
  ): Record<string, any> {
    return { ...defaults, ...config };
  }
}
