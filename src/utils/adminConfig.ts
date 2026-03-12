import { AdminConfig, DEFAULT_BRANDING, DEFAULT_FEATURES } from '../types/admin';

const ADMIN_CONFIG_KEY = 'admin-config';

export function getAdminConfig(): AdminConfig {
  const saved = localStorage.getItem(ADMIN_CONFIG_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        branding: { ...DEFAULT_BRANDING, ...parsed.branding },
        features: { ...DEFAULT_FEATURES, ...parsed.features },
        tradeType: parsed.tradeType,
        customFields: parsed.customFields || {},
      };
    } catch {
      return {
        branding: DEFAULT_BRANDING,
        features: DEFAULT_FEATURES,
      };
    }
  }
  return {
    branding: DEFAULT_BRANDING,
    features: DEFAULT_FEATURES,
  };
}

export function saveAdminConfig(config: AdminConfig) {
  localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(config));
  // Dispatch event for components to react to config changes
  window.dispatchEvent(new CustomEvent('admin-config-updated', { detail: config }));
}

export function applyBranding(branding: AdminConfig['branding']) {
  // Apply CSS variables for theming
  const root = document.documentElement;
  
  // Convert hex to HSL for Tailwind CSS variables
  const hexToHSL = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0 0% 0%';
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
  };
  
  root.style.setProperty('--primary', hexToHSL(branding.primaryColor));
  root.style.setProperty('--secondary', hexToHSL(branding.secondaryColor));
  root.style.setProperty('--accent', hexToHSL(branding.accentColor));
  
  // Update document title
  document.title = branding.appName;
  
  // Update favicon if provided
  if (branding.faviconUrl) {
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = branding.faviconUrl;
  }
}
