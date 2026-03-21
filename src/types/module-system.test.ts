import { describe, it, expect, beforeEach } from 'vitest';
import { ModuleRegistry, ModuleStorageManager, ModuleUtils } from '../types/module-system';
import type { ModuleDefinition, InstalledModule } from '../types/module-system';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDefinition(id: string, overrides: Partial<ModuleDefinition['metadata']> = {}): ModuleDefinition {
  return {
    metadata: {
      id,
      version: '1.0.0',
      title: `Module ${id}`,
      description: 'Test module',
      category: 'utility',
      ...overrides,
    },
    component: () => null as any,
  };
}

// ─── ModuleRegistry ───────────────────────────────────────────────────────────

describe('ModuleRegistry', () => {
  let registry: ModuleRegistry;

  beforeEach(() => {
    // Reset the singleton instance for a clean registry in each test
    (ModuleRegistry as any).instance = undefined;
    registry = ModuleRegistry.getInstance();
  });

  it('returns the same singleton instance', () => {
    const a = ModuleRegistry.getInstance();
    const b = ModuleRegistry.getInstance();
    expect(a).toBe(b);
  });

  it('starts empty', () => {
    expect(registry.count()).toBe(0);
    expect(registry.getAll()).toHaveLength(0);
  });

  describe('register', () => {
    it('registers a module and increases count', () => {
      registry.register(makeDefinition('mod-a'));
      expect(registry.count()).toBe(1);
    });

    it('returns the registered module via get()', () => {
      const def = makeDefinition('mod-b');
      registry.register(def);
      expect(registry.get('mod-b')).toBe(def);
    });

    it('overwrites a duplicate registration (with console.warn)', () => {
      const original = makeDefinition('dup');
      const replacement = makeDefinition('dup', { title: 'Replaced' });
      registry.register(original);
      registry.register(replacement);
      expect(registry.get('dup')?.metadata.title).toBe('Replaced');
      expect(registry.count()).toBe(1);
    });
  });

  describe('unregister', () => {
    it('removes a registered module', () => {
      registry.register(makeDefinition('to-remove'));
      registry.unregister('to-remove');
      expect(registry.has('to-remove')).toBe(false);
      expect(registry.count()).toBe(0);
    });

    it('is a no-op for non-existent IDs', () => {
      expect(() => registry.unregister('does-not-exist')).not.toThrow();
    });
  });

  describe('has', () => {
    it('returns true for registered modules', () => {
      registry.register(makeDefinition('present'));
      expect(registry.has('present')).toBe(true);
    });

    it('returns false for unregistered modules', () => {
      expect(registry.has('absent')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('returns all registered modules', () => {
      registry.register(makeDefinition('x'));
      registry.register(makeDefinition('y'));
      expect(registry.getAll()).toHaveLength(2);
    });
  });

  describe('getByCategory', () => {
    it('filters modules by category', () => {
      registry.register(makeDefinition('fin-1', { category: 'finance' }));
      registry.register(makeDefinition('fin-2', { category: 'finance' }));
      registry.register(makeDefinition('util-1', { category: 'utility' }));

      const finance = registry.getByCategory('finance');
      expect(finance).toHaveLength(2);
      expect(finance.every(m => m.metadata.category === 'finance')).toBe(true);
    });

    it('returns empty array for unknown category', () => {
      registry.register(makeDefinition('x', { category: 'finance' }));
      expect(registry.getByCategory('unknown')).toHaveLength(0);
    });
  });

  describe('importModule (stub)', () => {
    it('throws "not yet implemented" error', async () => {
      await expect(registry.importModule('...')).rejects.toThrow(
        'Dynamic module import not yet implemented'
      );
    });
  });
});

// ─── ModuleStorageManager ─────────────────────────────────────────────────────

describe('ModuleStorageManager', () => {
  const makeModule = (id: string, order = 0): InstalledModule => ({
    id,
    moduleId: `module-${id}`,
    enabled: true,
    order,
    config: {},
    installedAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  });

  it('returns empty array when nothing is stored', () => {
    expect(ModuleStorageManager.load()).toEqual([]);
  });

  it('saves and reloads modules preserving Date fields', () => {
    const modules = [makeModule('a'), makeModule('b', 1)];
    ModuleStorageManager.save(modules);

    const loaded = ModuleStorageManager.load();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].id).toBe('a');
    expect(loaded[0].installedAt).toBeInstanceOf(Date);
    expect(loaded[0].installedAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('preserves enabled/order/config fields', () => {
    const m = makeModule('c');
    m.enabled = false;
    m.order = 3;
    m.config = { key: 'value' };
    ModuleStorageManager.save([m]);

    const [loaded] = ModuleStorageManager.load();
    expect(loaded.enabled).toBe(false);
    expect(loaded.order).toBe(3);
    expect(loaded.config).toEqual({ key: 'value' });
  });

  it('clear() removes all stored modules', () => {
    ModuleStorageManager.save([makeModule('d')]);
    ModuleStorageManager.clear();
    expect(ModuleStorageManager.load()).toEqual([]);
  });

  it('returns empty array if stored data is malformed JSON', () => {
    localStorage.setItem('installed-modules', 'not-valid-json');
    expect(ModuleStorageManager.load()).toEqual([]);
  });
});

// ─── ModuleUtils ──────────────────────────────────────────────────────────────

describe('ModuleUtils', () => {
  describe('validate', () => {
    it('returns valid for a complete, correct definition', () => {
      const result = ModuleUtils.validate(makeDefinition('valid'));
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('reports error when id is missing', () => {
      const def = makeDefinition('');
      const result = ModuleUtils.validate(def);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Module ID is required');
    });

    it('reports error when version is missing', () => {
      const def = makeDefinition('v-test');
      def.metadata.version = '';
      const result = ModuleUtils.validate(def);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Module version is required');
    });

    it('reports error when title is missing', () => {
      const def = makeDefinition('t-test');
      def.metadata.title = '';
      const result = ModuleUtils.validate(def);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Module title is required');
    });

    it('reports error when component is missing', () => {
      const def = makeDefinition('c-test');
      (def as any).component = undefined;
      const result = ModuleUtils.validate(def);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Module component is required');
    });

    it('reports errors for invalid config schema fields', () => {
      const def = makeDefinition('schema-test');
      def.metadata.configSchema = {
        fields: [
          { key: '', label: '', type: 'text', defaultValue: '' },
        ],
      };
      const result = ModuleUtils.validate(def);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('missing key'))).toBe(true);
      expect(result.errors.some(e => e.includes('missing label'))).toBe(true);
    });

    it('accumulates multiple errors', () => {
      const def = makeDefinition('');
      def.metadata.version = '';
      def.metadata.title = '';
      const result = ModuleUtils.validate(def);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('generateInstanceId', () => {
    it('includes the moduleId as a prefix', () => {
      const id = ModuleUtils.generateInstanceId('my-module');
      expect(id.startsWith('my-module-')).toBe(true);
    });

    it('generates unique IDs on successive calls', () => {
      const ids = new Set(
        Array.from({ length: 20 }, () => ModuleUtils.generateInstanceId('test'))
      );
      expect(ids.size).toBe(20);
    });
  });

  describe('mergeConfig', () => {
    it('returns defaults when no override is provided', () => {
      const result = ModuleUtils.mergeConfig({ a: 1, b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('overrides default values with config values', () => {
      const result = ModuleUtils.mergeConfig({ a: 1, b: 2 }, { b: 99 });
      expect(result).toEqual({ a: 1, b: 99 });
    });

    it('adds new keys from config that are not in defaults', () => {
      const result = ModuleUtils.mergeConfig({ a: 1 }, { z: 42 });
      expect(result).toEqual({ a: 1, z: 42 });
    });

    it('handles both parameters being undefined/empty', () => {
      expect(ModuleUtils.mergeConfig()).toEqual({});
      expect(ModuleUtils.mergeConfig({})).toEqual({});
      expect(ModuleUtils.mergeConfig({}, {})).toEqual({});
    });
  });
});
