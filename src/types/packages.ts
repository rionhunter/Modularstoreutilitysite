export interface PackageDeal {
  id: string;
  name: string;
  tier: 'basic' | 'standard' | 'premium' | 'ultimate';
  price: number;
  description: string;
  active: boolean;
  
  // Included features
  includes: {
    lensType: 'single-vision' | 'bifocal' | 'progressive' | 'reading';
    material: 'plastic' | 'polycarbonate' | 'high-index' | 'trivex' | 'glass';
    index?: string;
    coatings: string[];
    tintIncluded: boolean;
    warrantyMonths: number;
    freeAdjustments: boolean;
    rushProcessing: boolean;
  };
  
  // Pricing adjustments
  frameMaxValue?: number; // Max frame value included, anything over charged extra
  
  // Display
  color?: string;
  icon?: string;
  featured?: boolean;
}

export interface LensOption {
  id: string;
  name: string;
  category: 'type' | 'material' | 'coating' | 'tint' | 'addon';
  price: number;
  description?: string;
  compatibleWith?: string[]; // IDs of other options this works with
}

export interface PricingRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'bundle';
  value: number;
  appliesTo: 'frame' | 'lenses' | 'coatings' | 'total';
  conditions?: {
    minPurchase?: number;
    specificItems?: string[];
    dateRange?: { start: string; end: string };
  };
  active: boolean;
}

export const DEFAULT_PACKAGES: PackageDeal[] = [
  {
    id: 'basic',
    name: 'Essentials',
    tier: 'basic',
    price: 199,
    description: 'Complete glasses with basic features',
    active: true,
    includes: {
      lensType: 'single-vision',
      material: 'plastic',
      index: '1.50',
      coatings: ['Scratch Resistant'],
      tintIncluded: false,
      warrantyMonths: 6,
      freeAdjustments: true,
      rushProcessing: false,
    },
    frameMaxValue: 150,
    color: '#94a3b8',
  },
  {
    id: 'standard',
    name: 'Comfort',
    tier: 'standard',
    price: 299,
    description: 'Enhanced lenses with protective coatings',
    active: true,
    includes: {
      lensType: 'single-vision',
      material: 'polycarbonate',
      index: '1.59',
      coatings: ['Scratch Resistant', 'Anti-Reflective', 'UV Protection'],
      tintIncluded: true,
      warrantyMonths: 12,
      freeAdjustments: true,
      rushProcessing: false,
    },
    frameMaxValue: 250,
    color: '#3b82f6',
  },
  {
    id: 'premium',
    name: 'Premium',
    tier: 'premium',
    price: 449,
    description: 'Advanced technology with blue light protection',
    active: true,
    includes: {
      lensType: 'progressive',
      material: 'high-index',
      index: '1.67',
      coatings: ['Scratch Resistant', 'Anti-Reflective', 'UV Protection', 'Blue Light Filter'],
      tintIncluded: true,
      warrantyMonths: 24,
      freeAdjustments: true,
      rushProcessing: true,
    },
    frameMaxValue: 400,
    color: '#8b5cf6',
    featured: true,
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    tier: 'ultimate',
    price: 649,
    description: 'Top-tier lenses with all premium features',
    active: true,
    includes: {
      lensType: 'progressive',
      material: 'high-index',
      index: '1.74',
      coatings: ['Scratch Resistant', 'Anti-Reflective', 'UV Protection', 'Blue Light Filter', 'Photochromic'],
      tintIncluded: true,
      warrantyMonths: 36,
      freeAdjustments: true,
      rushProcessing: true,
    },
    color: '#eab308',
    featured: true,
  },
];
