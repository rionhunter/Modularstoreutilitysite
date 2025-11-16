import { useState, useEffect, useCallback } from 'react';
import {
  InstalledModule,
  ModuleDefinition,
  ModuleStorageManager,
  ModuleUtils,
} from '../types/module-system';
import { getModuleRegistry } from '../modules/registry';

export interface UseModulesReturn {
  installedModules: InstalledModule[];
  availableModules: ModuleDefinition[];
  installModule: (moduleId: string, config?: Record<string, any>) => void;
  uninstallModule: (instanceId: string) => void;
  updateModule: (instanceId: string, updates: Partial<InstalledModule>) => void;
  enableModule: (instanceId: string) => void;
  disableModule: (instanceId: string) => void;
  reorderModules: (modules: InstalledModule[]) => void;
  getModuleDefinition: (moduleId: string) => ModuleDefinition | undefined;
  getInstalledModule: (instanceId: string) => InstalledModule | undefined;
}

/**
 * Hook for managing dashboard modules
 */
export function useModules(): UseModulesReturn {
  const [installedModules, setInstalledModules] = useState<InstalledModule[]>([]);
  const registry = getModuleRegistry();

  // Load installed modules from storage on mount
  useEffect(() => {
    const loaded = ModuleStorageManager.load();
    setInstalledModules(loaded);
  }, []);

  // Save to storage whenever modules change
  useEffect(() => {
    ModuleStorageManager.save(installedModules);
  }, [installedModules]);

  /**
   * Get all available modules from registry
   */
  const availableModules = registry.getAll();

  /**
   * Install a new module
   */
  const installModule = useCallback(
    (moduleId: string, config?: Record<string, any>) => {
      const definition = registry.get(moduleId);
      if (!definition) {
        console.error(`Module ${moduleId} not found in registry`);
        return;
      }

      const instanceId = ModuleUtils.generateInstanceId(moduleId);
      const mergedConfig = ModuleUtils.mergeConfig(
        definition.metadata.defaultConfig,
        config
      );

      const newModule: InstalledModule = {
        id: instanceId,
        moduleId,
        enabled: true,
        order: installedModules.length,
        config: mergedConfig,
        installedAt: new Date(),
        updatedAt: new Date(),
      };

      setInstalledModules(prev => [...prev, newModule]);

      // Call onInstall hook if it exists
      if (definition.onInstall) {
        definition.onInstall();
      }
    },
    [registry, installedModules.length]
  );

  /**
   * Uninstall a module
   */
  const uninstallModule = useCallback(
    (instanceId: string) => {
      const module = installedModules.find(m => m.id === instanceId);
      if (!module) return;

      const definition = registry.get(module.moduleId);

      setInstalledModules(prev => prev.filter(m => m.id !== instanceId));

      // Call onUninstall hook if it exists
      if (definition?.onUninstall) {
        definition.onUninstall();
      }
    },
    [installedModules, registry]
  );

  /**
   * Update a module's configuration or properties
   */
  const updateModule = useCallback(
    (instanceId: string, updates: Partial<InstalledModule>) => {
      setInstalledModules(prev =>
        prev.map(m =>
          m.id === instanceId
            ? { ...m, ...updates, updatedAt: new Date() }
            : m
        )
      );
    },
    []
  );

  /**
   * Enable a module
   */
  const enableModule = useCallback(
    (instanceId: string) => {
      const module = installedModules.find(m => m.id === instanceId);
      if (!module) return;

      const definition = registry.get(module.moduleId);

      updateModule(instanceId, { enabled: true });

      // Call onEnable hook if it exists
      if (definition?.onEnable) {
        definition.onEnable();
      }
    },
    [installedModules, registry, updateModule]
  );

  /**
   * Disable a module
   */
  const disableModule = useCallback(
    (instanceId: string) => {
      const module = installedModules.find(m => m.id === instanceId);
      if (!module) return;

      const definition = registry.get(module.moduleId);

      updateModule(instanceId, { enabled: false });

      // Call onDisable hook if it exists
      if (definition?.onDisable) {
        definition.onDisable();
      }
    },
    [installedModules, registry, updateModule]
  );

  /**
   * Reorder modules
   */
  const reorderModules = useCallback((modules: InstalledModule[]) => {
    const reordered = modules.map((m, index) => ({
      ...m,
      order: index,
      updatedAt: new Date(),
    }));
    setInstalledModules(reordered);
  }, []);

  /**
   * Get a module definition from registry
   */
  const getModuleDefinition = useCallback(
    (moduleId: string) => {
      return registry.get(moduleId);
    },
    [registry]
  );

  /**
   * Get an installed module by instance ID
   */
  const getInstalledModule = useCallback(
    (instanceId: string) => {
      return installedModules.find(m => m.id === instanceId);
    },
    [installedModules]
  );

  return {
    installedModules,
    availableModules,
    installModule,
    uninstallModule,
    updateModule,
    enableModule,
    disableModule,
    reorderModules,
    getModuleDefinition,
    getInstalledModule,
  };
}
