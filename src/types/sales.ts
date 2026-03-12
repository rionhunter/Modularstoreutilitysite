export interface OpticalPrescription {
  rightEye: {
    sphere: string;
    cylinder: string;
    axis: string;
    add: string;
    prism?: string;
    base?: string;
  };
  leftEye: {
    sphere: string;
    cylinder: string;
    axis: string;
    add: string;
    prism?: string;
    base?: string;
  };
  pd: {
    right: string;
    left: string;
    binocular?: string;
  };
  prescribedBy?: string;
  prescriptionDate?: string;
  expiryDate?: string;
}

export interface OpticalFrame {
  id: string;
  brand: string;
  model: string;
  color: string;
  size: string;
  price: number;
  sku?: string;
  
  // Frame measurements
  dbl?: string; // Distance Between Lenses
  ed?: string; // Effective Diameter
  b?: string; // B measurement (vertical height)
  a?: string; // A measurement (horizontal width)
}

export interface LensSpecification {
  type: 'single-vision' | 'bifocal' | 'progressive' | 'reading';
  material: 'plastic' | 'polycarbonate' | 'high-index' | 'glass' | 'trivex';
  index?: string;
  coating: string[];
  tint?: {
    type: string;
    color: string;
    density: string;
  };
  price: number;
}

export interface PatientInfo {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email?: string;
  phone: string;
  address?: string;
  
  // Medical claim fields
  healthFund?: string;
  memberNumber?: string;
  claimNumber?: string;
}

export interface OpticalSale {
  id: string;
  saleNumber: string;
  date: string;
  patient: PatientInfo;
  prescription: OpticalPrescription;
  frame: OpticalFrame;
  lenses: LensSpecification;
  
  // Additional items
  additionalItems?: {
    name: string;
    price: number;
    quantity: number;
  }[];
  
  // Pricing
  framePrice: number;
  lensPrice: number;
  coatingPrice: number;
  tintPrice: number;
  additionalItemsTotal: number;
  subtotal: number;
  tax: number;
  healthFundRebate: number;
  total: number;
  
  // Payment
  paymentMethod?: string;
  paymentStatus: 'pending' | 'paid' | 'partial';
  amountPaid: number;
  
  // Fulfillment
  status: 'pending' | 'ordered' | 'ready' | 'dispensed' | 'cancelled';
  orderDate?: string;
  expectedDate?: string;
  dispensedDate?: string;
  dispensedBy?: string;
  
  notes?: string;
}
