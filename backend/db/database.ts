import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Product, Manufacturer, Review, User, ComplianceRule, ScanLog } from '../types.js';

interface DatabaseSchema {
  users: User[];
  products: Product[];
  manufacturers: Manufacturer[];
  reviews: Review[];
  complianceRules: ComplianceRule[];
  scanLogs: ScanLog[];
}

const DB_DIR = path.join(process.cwd(), 'backend', 'data');
const DB_FILE = path.join(DB_DIR, 'foodlens.json');

class Database {
  private data: DatabaseSchema = {
    users: [],
    products: [],
    manufacturers: [],
    reviews: [],
    complianceRules: [],
    scanLogs: []
  };

  private listeners: ((event: string, payload: unknown) => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        return;
      } catch (err) {
        console.error('Error reading existing database file, re-seeding...', err);
      }
    }

    this.seedDefaultData();
    this.persist();
  }

  private persist() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  public subscribe(listener: (event: string, payload: unknown) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public broadcast(event: string, payload: unknown) {
    this.listeners.forEach(fn => {
      try {
        fn(event, payload);
      } catch (e) {
        console.error('SSE Broadcast error:', e);
      }
    });
  }

  private seedDefaultData() {
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('password123', salt);

    const users: User[] = [
      {
        id: 'u1',
        name: 'Priya Sharma',
        email: 'consumer@foodlens.io',
        passwordHash: defaultPasswordHash,
        role: 'consumer',
        createdAt: '2026-01-10T10:00:00.000Z'
      },
      {
        id: 'u2',
        name: 'Anandmilan Foods Official',
        email: 'seller@foodlens.io',
        passwordHash: defaultPasswordHash,
        role: 'seller',
        createdAt: '2026-02-14T08:30:00.000Z'
      },
      {
        id: 'u3',
        name: 'Rajesh Verma (FSSAI Inspector)',
        email: 'officer@foodlens.io',
        passwordHash: defaultPasswordHash,
        role: 'officer',
        createdAt: '2026-03-01T09:15:00.000Z'
      }
    ];

    const manufacturers: Manufacturer[] = [
      {
        id: 'm1',
        name: 'Anandmilan Foods Pvt. Ltd.',
        address: 'Plot 14, MIDC Industrial Area, Nashik, Maharashtra – 422010, India',
        info: 'FSSAI-licensed packaged food manufacturer producing biscuits, snacks and breakfast cereals since 2004.',
        fssaiLicense: '11518018000234',
        productIds: ['p1', 'p4']
      },
      {
        id: 'm2',
        name: 'Sundara Beverages Ltd.',
        address: 'Sector 8, Industrial Estate, Vadodara, Gujarat – 390016, India',
        info: 'Manufactures packaged juices, flavoured drinks and dairy-based beverages, distributed across Western India.',
        fssaiLicense: '10719022000567',
        productIds: ['p2', 'p5']
      },
      {
        id: 'm3',
        name: 'Greenfield Naturals',
        address: 'Village Road, Ludhiana, Punjab – 141001, India',
        info: 'Specialises in whole-grain and low-sugar packaged snacks positioned as healthier alternatives.',
        fssaiLicense: '12117001000891',
        productIds: ['p3']
      }
    ];

    const products: Product[] = [
      {
        id: 'p1',
        barcode: '8901030814',
        name: 'NutriCrunch Multigrain Biscuits',
        brand: 'NutriCrunch',
        category: 'Biscuits',
        manufacturerId: 'm1',
        mrp: '₹45.00',
        netQty: '200 g',
        mfgDate: '03/2026',
        expiry: '09/2026',
        origin: 'Made in India',
        storage: 'Store in a cool, dry place. Keep away from direct sunlight.',
        complianceStatus: 'WARNING',
        ingredients: [
          { name: 'Refined Wheat Flour', flag: false },
          { name: 'Sugar', flag: false },
          { name: 'Edible Vegetable Oil', flag: false },
          { name: 'Multigrain Mix (Oats, Ragi, Bajra)', flag: false },
          { name: 'Raising Agents (INS 503(ii), INS 500(ii))', flag: false },
          { name: 'Emulsifier (INS 322)', flag: true, note: 'Class name present; specific source not legible on label.' },
          { name: 'Artificial Flavouring Substances', flag: true, note: 'Type of flavour not specified on pack.' },
          { name: 'Iodised Salt', flag: false }
        ],
        ingredientNote: '2 of 8 declared ingredients need a clearer label photo to confirm full disclosure.',
        nutrition: {
          calories: { value: 462, unit: 'kcal', pct: 62 },
          sugar: { value: 18.4, unit: 'g', pct: 46 },
          fat: { value: 16.2, unit: 'g', pct: 54 },
          protein: { value: 7.1, unit: 'g', pct: 24 },
          sodium: { value: 410, unit: 'mg', pct: 41 }
        },
        claims: [
          { claim: 'Sugar Free', status: 'NEEDS VERIFICATION', explanation: 'Ingredient list declares sugar; review against applicable claim requirements before relying on this claim.' },
          { claim: 'Rich in Fibre', status: 'NEEDS VERIFICATION', explanation: 'Fibre content not listed in the extracted nutrition panel — recommend confirming against the manufacturer\'s declared values.' },
          { claim: 'No Added Preservatives', status: 'PASS', explanation: 'No preservative class names detected among the extracted ingredients.' }
        ],
        checklist: [
          { req: 'Product Name', val: 'NutriCrunch Multigrain Biscuits', status: 'PASS' },
          { req: 'Manufacturer', val: 'Anandmilan Foods Pvt. Ltd., Nashik', status: 'PASS' },
          { req: 'Net Quantity', val: '200 g', status: 'PASS' },
          { req: 'MRP', val: '₹45.00 (incl. of all taxes)', status: 'PASS' },
          { req: 'Date Information', val: 'Mfg 03/2026, exact best-before day not legible', status: 'WARNING' },
          { req: 'Mandatory Declaration', val: 'FSSAI license number partially visible', status: 'NEEDS VERIFICATION' }
        ],
        rating: 4.2,
        reviewCount: 486,
        createdAt: '2026-01-15T00:00:00.000Z'
      },
      {
        id: 'p2',
        barcode: '8901030992',
        name: 'Sundara Real Orange Juice',
        brand: 'Sundara',
        category: 'Beverages',
        manufacturerId: 'm2',
        mrp: '₹35.00',
        netQty: '200 ml',
        mfgDate: '05/2026',
        expiry: '11/2026',
        origin: 'Made in India',
        storage: 'Refrigerate after opening. Consume within 3 days.',
        complianceStatus: 'COMPLIANT',
        ingredients: [
          { name: 'Orange Juice Concentrate (65%)', flag: false },
          { name: 'Water', flag: false },
          { name: 'Sugar', flag: false },
          { name: 'Acidity Regulator (INS 330)', flag: false },
          { name: 'Stabiliser (INS 440)', flag: false },
          { name: 'Natural Orange Flavour', flag: false }
        ],
        ingredientNote: 'All declared ingredients extracted clearly from the label.',
        nutrition: {
          calories: { value: 96, unit: 'kcal', pct: 13 },
          sugar: { value: 20.1, unit: 'g', pct: 50 },
          fat: { value: 0.1, unit: 'g', pct: 1 },
          protein: { value: 0.4, unit: 'g', pct: 1 },
          sodium: { value: 12, unit: 'mg', pct: 1 }
        },
        claims: [
          { claim: 'No Artificial Colours', status: 'PASS', explanation: 'No colour additive class names detected in the extracted ingredient list.' },
          { claim: 'Made with Real Fruit', status: 'PASS', explanation: 'Orange juice concentrate is declared as the primary ingredient, consistent with the claim.' }
        ],
        checklist: [
          { req: 'Product Name', val: 'Sundara Real Orange Juice', status: 'PASS' },
          { req: 'Manufacturer', val: 'Sundara Beverages Ltd., Vadodara', status: 'PASS' },
          { req: 'Net Quantity', val: '200 ml', status: 'PASS' },
          { req: 'MRP', val: '₹35.00 (incl. of all taxes)', status: 'PASS' },
          { req: 'Date Information', val: 'Mfg 05/2026, Best before 11/2026', status: 'PASS' },
          { req: 'Mandatory Declaration', val: 'FSSAI license number clearly visible', status: 'PASS' }
        ],
        rating: 4.5,
        reviewCount: 212,
        createdAt: '2026-02-01T00:00:00.000Z'
      },
      {
        id: 'p3',
        barcode: '8901030775',
        name: 'Greenfield Oats & Millet Biscuits',
        brand: 'Greenfield Naturals',
        category: 'Biscuits',
        manufacturerId: 'm3',
        mrp: '₹52.00',
        netQty: '180 g',
        mfgDate: '04/2026',
        expiry: '10/2026',
        origin: 'Made in India',
        storage: 'Store in a cool, dry place.',
        complianceStatus: 'COMPLIANT',
        ingredients: [
          { name: 'Whole Wheat Flour', flag: false },
          { name: 'Rolled Oats (18%)', flag: false },
          { name: 'Jaggery', flag: false },
          { name: 'Foxtail Millet Flour', flag: false },
          { name: 'Edible Vegetable Oil', flag: false },
          { name: 'Raising Agent (INS 503(ii))', flag: false }
        ],
        ingredientNote: 'All declared ingredients extracted clearly from the label.',
        nutrition: {
          calories: { value: 401, unit: 'kcal', pct: 53 },
          sugar: { value: 9.8, unit: 'g', pct: 25 },
          fat: { value: 11.4, unit: 'g', pct: 38 },
          protein: { value: 9.6, unit: 'g', pct: 32 },
          sodium: { value: 280, unit: 'mg', pct: 28 }
        },
        claims: [
          { claim: 'Low Sugar', status: 'PASS', explanation: 'Declared sugar content is within a commonly accepted low-sugar reference range for this category.' },
          { claim: 'Whole Grain', status: 'PASS', explanation: 'Whole wheat flour and rolled oats together form the majority ingredient share.' }
        ],
        checklist: [
          { req: 'Product Name', val: 'Greenfield Oats & Millet Biscuits', status: 'PASS' },
          { req: 'Manufacturer', val: 'Greenfield Naturals, Ludhiana', status: 'PASS' },
          { req: 'Net Quantity', val: '180 g', status: 'PASS' },
          { req: 'MRP', val: '₹52.00 (incl. of all taxes)', status: 'PASS' },
          { req: 'Date Information', val: 'Mfg 04/2026, Best before 10/2026', status: 'PASS' },
          { req: 'Mandatory Declaration', val: 'FSSAI license number clearly visible', status: 'PASS' }
        ],
        rating: 4.6,
        reviewCount: 158,
        createdAt: '2026-02-10T00:00:00.000Z'
      },
      {
        id: 'p4',
        barcode: '8901030601',
        name: 'NutriCrunch Choco Cream Wafers',
        brand: 'NutriCrunch',
        category: 'Biscuits',
        manufacturerId: 'm1',
        mrp: '₹30.00',
        netQty: '75 g',
        mfgDate: '02/2026',
        expiry: '08/2026',
        origin: 'Made in India',
        storage: 'Store in a cool, dry place.',
        complianceStatus: 'NEEDS VERIFICATION',
        ingredients: [
          { name: 'Refined Wheat Flour', flag: false },
          { name: 'Sugar', flag: false },
          { name: 'Cocoa Solids', flag: false },
          { name: 'Vegetable Fat', flag: true, note: 'Source oil not specified.' },
          { name: 'Emulsifiers', flag: true, note: 'Individual INS numbers not legible.' }
        ],
        ingredientNote: '2 of 5 declared ingredients need a clearer label photo to confirm full disclosure.',
        nutrition: {
          calories: { value: 512, unit: 'kcal', pct: 69 },
          sugar: { value: 34.2, unit: 'g', pct: 86 },
          fat: { value: 24.6, unit: 'g', pct: 82 },
          protein: { value: 5.4, unit: 'g', pct: 18 },
          sodium: { value: 190, unit: 'mg', pct: 19 }
        },
        claims: [
          { claim: 'Made with Real Cocoa', status: 'NEEDS VERIFICATION', explanation: 'Cocoa solids percentage not stated on the extracted label; confirm before relying on this claim.' }
        ],
        checklist: [
          { req: 'Product Name', val: 'NutriCrunch Choco Cream Wafers', status: 'PASS' },
          { req: 'Manufacturer', val: 'Anandmilan Foods Pvt. Ltd., Nashik', status: 'PASS' },
          { req: 'Net Quantity', val: '75 g', status: 'PASS' },
          { req: 'MRP', val: '₹30.00 (incl. of all taxes)', status: 'PASS' },
          { req: 'Date Information', val: 'Expiry day not legible', status: 'NEEDS VERIFICATION' },
          { req: 'Mandatory Declaration', val: 'FSSAI license number not visible in uploaded images', status: 'NEEDS VERIFICATION' }
        ],
        rating: 3.9,
        reviewCount: 97,
        createdAt: '2026-02-20T00:00:00.000Z'
      },
      {
        id: 'p5',
        barcode: '8901030450',
        name: 'Sundara Mango Sip',
        brand: 'Sundara',
        category: 'Beverages',
        manufacturerId: 'm2',
        mrp: '₹20.00',
        netQty: '150 ml',
        mfgDate: '06/2026',
        expiry: '12/2026',
        origin: 'Made in India',
        storage: 'Store away from direct sunlight.',
        complianceStatus: 'WARNING',
        ingredients: [
          { name: 'Water', flag: false },
          { name: 'Sugar', flag: false },
          { name: 'Mango Pulp (10%)', flag: false },
          { name: 'Acidity Regulator (INS 330)', flag: false },
          { name: 'Artificial Flavour', flag: true, note: 'Present alongside mango pulp; proportion not declared.' }
        ],
        ingredientNote: '1 of 5 declared ingredients needs a clearer label photo to confirm full disclosure.',
        nutrition: {
          calories: { value: 64, unit: 'kcal', pct: 9 },
          sugar: { value: 15.3, unit: 'g', pct: 38 },
          fat: { value: 0, unit: 'g', pct: 0 },
          protein: { value: 0.1, unit: 'g', pct: 0 },
          sodium: { value: 8, unit: 'mg', pct: 1 }
        },
        claims: [
          { claim: 'Made with Real Mango', status: 'WARNING', explanation: 'Mango pulp is present at a low declared share alongside artificial flavouring — review claim wording against actual composition.' }
        ],
        checklist: [
          { req: 'Product Name', val: 'Sundara Mango Sip', status: 'PASS' },
          { req: 'Manufacturer', val: 'Sundara Beverages Ltd., Vadodara', status: 'PASS' },
          { req: 'Net Quantity', val: '150 ml', status: 'PASS' },
          { req: 'MRP', val: '₹20.00 (incl. of all taxes)', status: 'PASS' },
          { req: 'Date Information', val: 'Mfg 06/2026, Best before 12/2026', status: 'PASS' },
          { req: 'Mandatory Declaration', val: 'Fruit content percentage declared in small print', status: 'WARNING' }
        ],
        rating: 4.0,
        reviewCount: 341,
        createdAt: '2026-03-01T00:00:00.000Z'
      }
    ];

    const reviews: Review[] = [
      {
        id: 'r1',
        productId: 'p1',
        user: 'Ankita R.',
        rating: 5,
        date: '2 weeks ago',
        text: 'Good everyday biscuit for tea time. Kids like the taste and it doesn\'t feel too sweet.',
        pros: 'Taste, texture',
        cons: 'Packaging could reseal better',
        createdAt: '2026-02-20T10:00:00.000Z'
      },
      {
        id: 'r2',
        productId: 'p1',
        user: 'Vivek S.',
        rating: 3,
        date: '1 month ago',
        text: 'Decent, but I wish the pack clearly listed the FSSAI number — had to check the app for that.',
        pros: 'Multigrain mix',
        cons: 'Label print quality',
        createdAt: '2026-02-05T14:30:00.000Z'
      },
      {
        id: 'r3',
        productId: 'p1',
        user: 'Priya M.',
        rating: 4,
        date: '2 months ago',
        text: 'Good option for a quick snack. The sugar-free claim needs more clarity though.',
        pros: 'Crunchy, filling',
        cons: 'Claim wording',
        createdAt: '2026-01-12T09:15:00.000Z'
      },
      {
        id: 'r4',
        productId: 'p2',
        user: 'Karthik N.',
        rating: 5,
        date: '3 weeks ago',
        text: 'Tastes fresh and clean. Very good fruit content label transparency.',
        pros: 'Real juice taste',
        cons: 'High natural sugar',
        createdAt: '2026-02-15T11:00:00.000Z'
      }
    ];

    const complianceRules: ComplianceRule[] = [
      {
        id: 'cr1',
        category: 'Legal Metrology',
        ruleName: 'Name and Address of the Manufacturer / Packer',
        description: 'Every package must display the complete name and address of the manufacturer, packer, or importer including pincode.',
        standardReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(a)',
        isMandatory: true
      },
      {
        id: 'cr2',
        category: 'Legal Metrology',
        ruleName: 'Standard Unit of Net Quantity',
        description: 'Net quantity must be declared in standard metric units (g, kg, ml, l). Words like "approx." or "when packed" are prohibited.',
        standardReference: 'Legal Metrology Rules, 2011 - Rule 6(1)(c)',
        isMandatory: true
      },
      {
        id: 'cr3',
        category: 'Legal Metrology',
        ruleName: 'Retail Sale Price (MRP Inclusive of all Taxes)',
        description: 'Maximum Retail Price must be declared in Indian Rupees, stating "incl. of all taxes". Overcharging is an offence.',
        standardReference: 'Legal Metrology Rules, 2011 - Rule 6(1)(e)',
        isMandatory: true
      },
      {
        id: 'cr4',
        category: 'FSSAI',
        ruleName: 'FSSAI 14-Digit License Number & Logo',
        description: 'The 14-digit license number of the manufacturer/brand owner must be printed on the principal display panel.',
        standardReference: 'FSSAI (Labelling & Display) Regulations, 2020 - Reg 5(4)',
        isMandatory: true
      },
      {
        id: 'cr5',
        category: 'FSSAI',
        ruleName: 'Nutritional Information Declaration',
        description: 'Panel must state Energy (kcal), Protein (g), Carbohydrates (g), Total Sugars & Added Sugars (g), Total Fat (g), Saturated/Trans Fat (g), and Sodium (mg) per 100g/ml or per single serving.',
        standardReference: 'FSSAI Regulations 2020 - Reg 5(3)',
        isMandatory: true
      },
      {
        id: 'cr6',
        category: 'FSSAI',
        ruleName: 'Ingredient Declaration in Descending Weight Order',
        description: 'Ingredients must be listed in descending order of their in-going weight (m/m) at the time of manufacture.',
        standardReference: 'FSSAI Regulations 2020 - Reg 5(1)',
        isMandatory: true
      },
      {
        id: 'cr7',
        category: 'Claims',
        ruleName: 'Nutrition & Health Claims Substantiation',
        description: 'Claims such as "Sugar Free", "Rich in Fibre", or "Low Fat" must meet strict statutory thresholds and disclose any contrasting facts.',
        standardReference: 'FSS (Advertising and Claims) Regulations, 2018',
        isMandatory: true
      }
    ];

    this.data = {
      users,
      manufacturers,
      products,
      reviews,
      complianceRules,
      scanLogs: []
    };
  }

  // --- Products ---
  public getProducts(filters?: { category?: string; brand?: string; complianceStatus?: string }): Product[] {
    let list = [...this.data.products];
    if (filters?.category) list = list.filter(p => p.category.toLowerCase() === filters.category!.toLowerCase());
    if (filters?.brand) list = list.filter(p => p.brand.toLowerCase() === filters.brand!.toLowerCase());
    if (filters?.complianceStatus) list = list.filter(p => p.complianceStatus === filters.complianceStatus);
    return list;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public getProductByBarcode(barcode: string): Product | undefined {
    const clean = barcode.trim();
    // Exact match
    const exact = this.data.products.find(p => p.barcode === clean);
    if (exact && !exact.name.includes('Packaged Product (Code:')) return exact;

    // Check variations (e.g. 12-digit Indian barcode without leading 8)
    let alt = '';
    if (/^\d{12}$/.test(clean) && clean.startsWith('90')) {
      alt = '8' + clean;
    } else if (/^890\d{10}$/.test(clean)) {
      alt = clean.slice(1);
    }
    if (alt) {
      const match = this.data.products.find(p => p.barcode === alt);
      if (match && !match.name.includes('Packaged Product (Code:')) return match;
    }

    return exact;
  }

  public upsertProduct(product: Product): Product {
    const idx = this.data.products.findIndex(p => p.id === product.id || p.barcode === product.barcode);
    if (idx !== -1) {
      this.data.products[idx] = { ...this.data.products[idx], ...product };
      const m = this.data.manufacturers.find(item => item.id === product.manufacturerId);
      if (m && !m.productIds.includes(product.id)) {
        m.productIds.push(product.id);
      }
      this.persist();
      this.broadcast('product:updated', this.data.products[idx]);
      return this.data.products[idx];
    }
    return this.addProduct(product);
  }

  public addProduct(product: Product): Product {
    this.data.products.push(product);
    // Link to manufacturer if exists
    const m = this.data.manufacturers.find(item => item.id === product.manufacturerId);
    if (m && !m.productIds.includes(product.id)) {
      m.productIds.push(product.id);
    }
    this.persist();
    this.broadcast('product:added', product);
    return product;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.products[idx] = { ...this.data.products[idx], ...updates };
    this.persist();
    this.broadcast('product:updated', this.data.products[idx]);
    return this.data.products[idx];
  }

  // --- Manufacturers ---
  public getManufacturers(): Manufacturer[] {
    return [...this.data.manufacturers];
  }

  public getManufacturerById(id: string): Manufacturer | undefined {
    return this.data.manufacturers.find(m => m.id === id);
  }

  // --- Reviews ---
  public getReviewsByProduct(productId: string): Review[] {
    return this.data.reviews.filter(r => r.productId === productId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addReview(review: Review): Review {
    this.data.reviews.push(review);
    // Recalculate product rating and count
    const prods = this.data.products.find(p => p.id === review.productId);
    if (prods) {
      const prodReviews = this.data.reviews.filter(r => r.productId === review.productId);
      const sum = prodReviews.reduce((acc, r) => acc + r.rating, 0);
      prods.rating = Number((sum / prodReviews.length).toFixed(1));
      prods.reviewCount = prodReviews.length;
    }
    this.persist();
    this.broadcast('review:added', { review, product: prods });
    return review;
  }

  // --- Users & Auth ---
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  // --- Compliance Rules ---
  public getComplianceRules(): ComplianceRule[] {
    return [...this.data.complianceRules];
  }

  // --- Scan Logs ---
  public logScan(log: ScanLog): ScanLog {
    this.data.scanLogs.push(log);
    this.persist();
    this.broadcast('scan:logged', log);
    return log;
  }

  public getScanLogs(userId?: string): ScanLog[] {
    if (userId) return this.data.scanLogs.filter(s => s.userId === userId).slice(-30);
    return this.data.scanLogs.slice(-30);
  }
}

export const db = new Database();
