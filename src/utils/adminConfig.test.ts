import { describe, it, expect, vi } from 'vitest';
import { getAdminConfig, saveAdminConfig, applyBranding } from '../utils/adminConfig';
import { DEFAULT_BRANDING, DEFAULT_FEATURES } from '../types/admin';

describe('getAdminConfig', () => {
  it('returns defaults when localStorage is empty', () => {
    const config = getAdminConfig();
    expect(config.branding).toEqual(DEFAULT_BRANDING);
    expect(config.features).toEqual(DEFAULT_FEATURES);
  });

  it('merges stored branding with defaults (so new fields always have a value)', () => {
    const partial = { branding: { primaryColor: '#ff0000' }, features: {} };
    localStorage.setItem('admin-config', JSON.stringify(partial));

    const config = getAdminConfig();
    expect(config.branding.primaryColor).toBe('#ff0000');
    // Fields not in the stored object still fall back to defaults
    expect(config.branding.appName).toBe(DEFAULT_BRANDING.appName);
  });

  it('returns defaults when stored JSON is malformed', () => {
    localStorage.setItem('admin-config', 'not-valid-json{{');
    const config = getAdminConfig();
    expect(config.branding).toEqual(DEFAULT_BRANDING);
    expect(config.features).toEqual(DEFAULT_FEATURES);
  });

  it('preserves tradeType and customFields from storage', () => {
    const stored = {
      branding: {},
      features: {},
      tradeType: 'optical',
      customFields: { foo: 'bar' },
    };
    localStorage.setItem('admin-config', JSON.stringify(stored));

    const config = getAdminConfig();
    expect(config.tradeType).toBe('optical');
    expect(config.customFields).toEqual({ foo: 'bar' });
  });

  it('defaults customFields to empty object when not stored', () => {
    localStorage.setItem('admin-config', JSON.stringify({ branding: {}, features: {} }));
    const config = getAdminConfig();
    expect(config.customFields).toEqual({});
  });
});

describe('saveAdminConfig', () => {
  it('persists the config to localStorage', () => {
    const config = { branding: DEFAULT_BRANDING, features: DEFAULT_FEATURES };
    saveAdminConfig(config);

    const stored = JSON.parse(localStorage.getItem('admin-config')!);
    expect(stored.branding.primaryColor).toBe(DEFAULT_BRANDING.primaryColor);
  });

  it('dispatches "admin-config-updated" custom event', () => {
    const handler = vi.fn();
    window.addEventListener('admin-config-updated', handler);

    saveAdminConfig({ branding: DEFAULT_BRANDING, features: DEFAULT_FEATURES });

    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener('admin-config-updated', handler);
  });

  it('round-trips correctly: save then load returns same config', () => {
    const config = {
      branding: { ...DEFAULT_BRANDING, primaryColor: '#123456' },
      features: { ...DEFAULT_FEATURES, sales: false },
      tradeType: 'bookstore',
      customFields: { key: 'value' },
    };
    saveAdminConfig(config);
    const loaded = getAdminConfig();

    expect(loaded.branding.primaryColor).toBe('#123456');
    expect(loaded.features.sales).toBe(false);
    expect(loaded.tradeType).toBe('bookstore');
    expect(loaded.customFields).toEqual({ key: 'value' });
  });
});

describe('applyBranding — hexToHSL conversion', () => {
  it('applies CSS variables without throwing', () => {
    expect(() => applyBranding(DEFAULT_BRANDING)).not.toThrow();
  });

  it('sets document.title to the appName', () => {
    applyBranding({ ...DEFAULT_BRANDING, appName: 'Test Store' });
    expect(document.title).toBe('Test Store');
  });

  it('sets --primary CSS variable for a pure red (#ff0000)', () => {
    applyBranding({ ...DEFAULT_BRANDING, primaryColor: '#ff0000' });
    const primary = document.documentElement.style.getPropertyValue('--primary');
    // Red in HSL is "0 100% 50%"
    expect(primary).toBe('0 100% 50%');
  });

  it('sets --primary CSS variable for pure white (#ffffff)', () => {
    applyBranding({ ...DEFAULT_BRANDING, primaryColor: '#ffffff' });
    const primary = document.documentElement.style.getPropertyValue('--primary');
    // White: hue=0, sat=0%, lig=100%
    expect(primary).toBe('0 0% 100%');
  });

  it('sets --primary CSS variable for pure black (#000000)', () => {
    applyBranding({ ...DEFAULT_BRANDING, primaryColor: '#000000' });
    const primary = document.documentElement.style.getPropertyValue('--primary');
    expect(primary).toBe('0 0% 0%');
  });

  it('does not throw for an invalid hex color (graceful fallback)', () => {
    expect(() =>
      applyBranding({ ...DEFAULT_BRANDING, primaryColor: 'not-a-color' })
    ).not.toThrow();
  });

  it('creates a favicon link element when faviconUrl is provided', () => {
    // Remove any existing icon links first
    document.querySelectorAll("link[rel*='icon']").forEach(el => el.remove());

    applyBranding({ ...DEFAULT_BRANDING, faviconUrl: 'https://example.com/favicon.ico' });

    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    expect(link).not.toBeNull();
    expect(link?.href).toBe('https://example.com/favicon.ico');
  });
});
