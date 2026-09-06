export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'consumer' | 'seller' | 'officer';
  createdAt: string;
}

export interface Ingredient {
  name: string;
  flag: boolean;
  note?: string;
}

export interface NutritionItem {
  value: number;
  unit: string;
  pct: number;
}

export interface ClaimCheck {
  claim: string;
  status: 'PASS' | 'WARNING' | 'NEEDS VERIFICATION';
  explanation: string;
}

export interface ChecklistItem {
  req: string;
  val: string;
  status: 'PASS' | 'WARNING' | 'NEEDS VERIFICATION';
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  manufacturerId: string;
  mrp: string;
  netQty: string;
  mfgDate: string;
  expiry: string;
  origin: string;
  storage: string;
  complianceStatus: 'COMPLIANT' | 'WARNING' | 'NEEDS VERIFICATION';
  ingredients: Ingredient[];
  ingredientNote: string;
  nutrition: {
    calories: NutritionItem;
    sugar: NutritionItem;
    fat: NutritionItem;
    protein: NutritionItem;
    sodium: NutritionItem;
    [key: string]: NutritionItem;
  };
  claims: ClaimCheck[];
  checklist: ChecklistItem[];
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  verifiedBySeller?: boolean;
  createdAt: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  address: string;
  info: string;
  fssaiLicense?: string;
  productIds: string[];
}

export interface Review {
  id: string;
  productId: string;
  userId?: string;
  user: string;
  rating: number;
  date: string;
  text: string;
  pros: string;
  cons: string;
  createdAt: string;
}

export interface ComplianceRule {
  id: string;
  category: 'Legal Metrology' | 'FSSAI' | 'Nutrition' | 'Claims';
  ruleName: string;
  description: string;
  standardReference: string;
  isMandatory: boolean;
}

export interface ScanLog {
  id: string;
  userId?: string;
  productId: string;
  productName: string;
  scanType: 'barcode' | 'images' | 'manual';
  status: 'COMPLIANT' | 'WARNING' | 'NEEDS VERIFICATION';
  timestamp: string;
}
