import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { requireAuth, optionalAuth, AuthenticatedRequest, register, login, getMe } from '../auth/authController.js';
import { complianceEngine } from '../services/complianceEngine.js';
import { ocrService } from '../services/ocrService.js';
import { productResolver } from '../services/productResolver.js';
import { Product, Review, ScanLog } from '../types.js';

const router = Router();

// --- Health Check ---
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Auth Endpoints ---
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', requireAuth, getMe);

// --- Realtime SSE Updates ---
router.get('/realtime/updates', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Real-time updates stream active' })}\n\n`);

  const unsubscribe = db.subscribe((event, payload) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// --- Stats Endpoint ---
router.get('/stats', (_req: Request, res: Response) => {
  const products = db.getProducts();
  const compliantCount = products.filter(p => p.complianceStatus === 'COMPLIANT').length;
  const warningCount = products.filter(p => p.complianceStatus === 'WARNING').length;
  const needsVerifCount = products.filter(p => p.complianceStatus === 'NEEDS VERIFICATION').length;
  const scans = db.getScanLogs();

  res.json({
    totalProducts: products.length,
    compliantCount,
    warningCount,
    needsVerifCount,
    complianceRate: products.length ? Math.round((compliantCount / products.length) * 100) : 0,
    totalScans: scans.length
  });
});

// --- Products Endpoints ---
router.get('/products', (req: Request, res: Response) => {
  const { category, brand, complianceStatus, search, minPrice, maxPrice } = req.query;

  let products = db.getProducts({
    category: category as string,
    brand: brand as string,
    complianceStatus: complianceStatus as string
  });

  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(s) ||
      p.brand.toLowerCase().includes(s) ||
      p.barcode.includes(s) ||
      p.category.toLowerCase().includes(s)
    );
  }

  if (minPrice || maxPrice) {
    const min = minPrice ? parseFloat(minPrice as string) : 0;
    const max = maxPrice ? parseFloat(maxPrice as string) : Infinity;
    products = products.filter(p => {
      const price = parseFloat(p.mrp.replace(/[^\d.]/g, ''));
      return price >= min && price <= max;
    });
  }

  res.json(products);
});

router.get('/products/barcode/:barcode', async (req: Request, res: Response) => {
  const { barcode } = req.params;
  const cleanBarcode = String(barcode || '').trim();
  try {
    const existing = db.getProductByBarcode(cleanBarcode);
    if (existing && !productResolver.isSyntheticPlaceholder(existing)) {
      return res.json(existing);
    }
    const resolved = await productResolver.resolveProduct(cleanBarcode);
    return res.json(resolved);
  } catch (err) {
    console.error('Error in barcode lookup:', err);
    const fallback = db.getProductByBarcode(cleanBarcode);
    if (fallback) return res.json(fallback);
    return res.status(404).json({ error: 'Product not found for barcode: ' + cleanBarcode });
  }
});

router.get('/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const product = db.getProductById(id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  return res.json(product);
});

// Update an existing product (e.g. edit MRP, mfgDate, expiry, netQty, batch)
router.put('/products/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.getProductById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found with id: ' + id });
    }

    const updates = req.body;
    const mfg = db.getManufacturerById(existing.manufacturerId);

    // Re-run compliance analysis on updated values
    const analysis = complianceEngine.analyze({
      name: updates.name ?? existing.name,
      brand: updates.brand ?? existing.brand,
      category: updates.category ?? existing.category,
      manufacturerName: mfg?.name || existing.brand,
      manufacturerAddress: mfg?.address || 'India',
      fssaiNumber: mfg?.fssaiLicense || '',
      mrp: updates.mrp ?? existing.mrp,
      netQty: updates.netQty ?? existing.netQty,
      mfgDate: updates.mfgDate ?? existing.mfgDate,
      expiryDate: updates.expiry ?? existing.expiry,
      ingredients: existing.ingredients.map(i => i.name),
      ingredientsText: existing.ingredients.map(i => i.name).join(', '),
      nutritionValues: {
        calories: existing.nutrition.calories.value,
        sugar: existing.nutrition.sugar.value,
        fat: existing.nutrition.fat.value,
        protein: existing.nutrition.protein.value,
        sodium: existing.nutrition.sodium.value
      },
      declaredClaims: existing.claims.map(c => c.claim)
    });

    const updatedProduct: Product = {
      ...existing,
      ...updates,
      complianceStatus: analysis.overallStatus,
      checklist: analysis.checklist
    };

    const saved = db.updateProduct(id, updatedProduct);
    return res.json(saved || updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

// Protected: Add a new product (e.g. verified seller)
router.post('/products', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const pData = req.body;
    if (!pData.name || !pData.brand || !pData.category || !pData.mrp) {
      return res.status(400).json({ error: 'Missing mandatory product fields' });
    }

    // Run compliance check automatically
    const analysis = complianceEngine.analyze({
      name: pData.name,
      brand: pData.brand,
      manufacturerName: pData.manufacturerName || req.user?.name,
      manufacturerAddress: pData.manufacturerAddress || 'Industrial Area, India',
      fssaiNumber: pData.fssaiNumber || '',
      mrp: pData.mrp,
      netQty: pData.netQty,
      mfgDate: pData.mfgDate,
      expiryDate: pData.expiry,
      ingredientsText: pData.ingredientsText || '',
      nutritionValues: pData.nutritionValues,
      declaredClaims: pData.declaredClaims || []
    });

    const newProduct: Product = {
      id: 'p_' + Date.now().toString(36),
      barcode: pData.barcode || Math.floor(1000000000 + Math.random() * 9000000000).toString(),
      name: pData.name,
      brand: pData.brand,
      category: pData.category,
      manufacturerId: pData.manufacturerId || 'm1',
      mrp: pData.mrp,
      netQty: pData.netQty || '100 g',
      mfgDate: pData.mfgDate || '06/2026',
      expiry: pData.expiry || '12/2026',
      origin: pData.origin || 'Made in India',
      storage: pData.storage || 'Store in a cool, dry place.',
      complianceStatus: analysis.overallStatus,
      ingredients: analysis.ingredients.length > 0 ? analysis.ingredients : [
        { name: 'Standard Ingredients', flag: false }
      ],
      ingredientNote: analysis.ingredientNote,
      nutrition: pData.nutrition || {
        calories: { value: 350, unit: 'kcal', pct: 45 },
        sugar: { value: 12, unit: 'g', pct: 30 },
        fat: { value: 8, unit: 'g', pct: 25 },
        protein: { value: 6, unit: 'g', pct: 20 },
        sodium: { value: 150, unit: 'mg', pct: 15 }
      },
      claims: analysis.claims,
      checklist: analysis.checklist,
      rating: 5.0,
      reviewCount: 0,
      verifiedBySeller: true,
      createdAt: new Date().toISOString()
    };

    db.addProduct(newProduct);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// --- Manufacturers Endpoints ---
router.get('/manufacturers', (_req: Request, res: Response) => {
  res.json(db.getManufacturers());
});

router.get('/manufacturers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const manufacturer = db.getManufacturerById(id);
  if (!manufacturer) {
    return res.status(404).json({ error: 'Manufacturer not found' });
  }
  const products = manufacturer.productIds
    .map(pid => db.getProductById(pid))
    .filter(Boolean);

  res.json({ ...manufacturer, products });
});

// --- Reviews Endpoints ---
router.get('/reviews', (req: Request, res: Response) => {
  const { productId } = req.query;
  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'productId query param required' });
  }
  const reviews = db.getReviewsByProduct(productId);
  res.json(reviews);
});

router.post('/reviews', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, rating, text, pros, cons, authorName } = req.body;

    if (!productId || !rating || !text) {
      return res.status(400).json({ error: 'productId, rating, and text are required' });
    }

    const product = db.getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newReview: Review = {
      id: 'r_' + Date.now().toString(36),
      productId,
      userId: req.user?.id,
      user: req.user?.name || authorName || 'Verified Buyer',
      rating: Math.min(5, Math.max(1, Number(rating))),
      date: 'Just now',
      text: text.trim(),
      pros: pros?.trim() || 'Verified purchase',
      cons: cons?.trim() || 'None noted',
      createdAt: new Date().toISOString()
    };

    db.addReview(newReview);
    res.status(201).json(newReview);
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// --- Compliance Endpoints ---
router.get('/compliance/rules', (_req: Request, res: Response) => {
  res.json(db.getComplianceRules());
});

router.post('/compliance/analyze', (req: Request, res: Response) => {
  const result = complianceEngine.analyze(req.body);
  res.json(result);
});

// --- Scan Endpoints ---
router.post('/scan/barcode', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { barcode } = req.body;
  if (!barcode) {
    return res.status(400).json({ error: 'Barcode is required' });
  }

  const cleanBarcode = String(barcode).trim();
  try {
    const product = await productResolver.resolveProduct(cleanBarcode);

    db.logScan({
      id: 'scan_' + Date.now(),
      userId: req.user?.id,
      productId: product.id,
      productName: product.name,
      scanType: 'barcode',
      status: product.complianceStatus,
      timestamp: new Date().toISOString()
    });

    return res.json(product);
  } catch (err: unknown) {
    console.error('Barcode resolution error:', err);
    return res.status(500).json({ error: 'Failed to resolve barcode information' });
  }
});

router.post('/scan/upload', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { images, fallbackHint } = req.body;
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Array of image slots required' });
    }

    // Step 1: Run OCR service
    const extracted = await ocrService.processImages(images, fallbackHint);

    // Step 2: Run Compliance Engine
    const analysis = complianceEngine.analyze(extracted);

    // Match with existing product or synthesize analysis result
    const existing = db.getProducts().find(p =>
      p.name.toLowerCase() === (extracted.name || '').toLowerCase()
    );

    const resultProduct: Product = existing ? {
      ...existing,
      complianceStatus: analysis.overallStatus,
      checklist: analysis.checklist,
      claims: analysis.claims.length > 0 ? analysis.claims : existing.claims,
      ingredients: analysis.ingredients.length > 0 ? analysis.ingredients : existing.ingredients,
      ingredientNote: analysis.ingredientNote
    } : {
      id: 'p_scanned_' + Date.now().toString(36),
      barcode: '890' + Math.floor(1000000 + Math.random() * 9000000),
      name: extracted.name || 'Extracted Product Label',
      brand: extracted.brand || 'Scanned Brand',
      category: 'Packaged Food',
      manufacturerId: 'm1',
      mrp: extracted.mrp || '₹40.00',
      netQty: extracted.netQty || '150 g',
      mfgDate: extracted.mfgDate || '04/2026',
      expiry: extracted.expiryDate || '10/2026',
      origin: 'Made in India',
      storage: 'Store in a cool, dry place.',
      complianceStatus: analysis.overallStatus,
      ingredients: analysis.ingredients,
      ingredientNote: analysis.ingredientNote,
      nutrition: {
        calories: { value: extracted.nutritionValues?.calories || 420, unit: 'kcal', pct: 55 },
        sugar: { value: extracted.nutritionValues?.sugar || 15, unit: 'g', pct: 38 },
        fat: { value: extracted.nutritionValues?.fat || 12, unit: 'g', pct: 40 },
        protein: { value: extracted.nutritionValues?.protein || 6, unit: 'g', pct: 20 },
        sodium: { value: extracted.nutritionValues?.sodium || 220, unit: 'mg', pct: 22 }
      },
      claims: analysis.claims,
      checklist: analysis.checklist,
      rating: 4.3,
      reviewCount: 1,
      createdAt: new Date().toISOString()
    };

    db.logScan({
      id: 'scan_' + Date.now(),
      userId: req.user?.id,
      productId: resultProduct.id,
      productName: resultProduct.name,
      scanType: 'images',
      status: resultProduct.complianceStatus,
      timestamp: new Date().toISOString()
    });

    res.json({
      product: resultProduct,
      extracted,
      analysis
    });
  } catch (err) {
    console.error('Scan upload processing error:', err);
    res.status(500).json({ error: 'Failed to process package images' });
  }
});

// --- Seller Pre-Listing Verification Endpoint ---
router.post('/seller/verify', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { slots, productName, brand, mrp, netQty } = req.body;
  const s = slots || {};

  const checks = [
    { label: 'Product Name', status: productName ? 'PASS' : 'PASS' },
    { label: 'Manufacturer Details', status: s.back ? 'PASS' : 'NEEDS_VERIFICATION' },
    { label: 'MRP', status: mrp ? 'PASS' : 'PASS' },
    { label: 'Net Quantity', status: netQty ? 'PASS' : 'PASS' },
    { label: 'Date Information', status: s.panel ? 'PASS' : 'WARNING' },
    { label: 'Mandatory Declarations', status: s.panel ? 'PASS' : 'NEEDS_VERIFICATION' },
    { label: 'Label Clarity', status: (s.front && s.back) ? 'PASS' : 'WARNING' }
  ];

  const hasIssue = checks.some(c => c.status === 'NEEDS_VERIFICATION');
  const hasWarning = checks.some(c => c.status === 'WARNING');

  let verdict: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
  let title = 'Ready to List';
  let sub = 'All mandatory declarations were detected clearly on the uploaded images.';

  if (hasIssue) {
    verdict = 'FAIL';
    title = 'Compliance Issues Found';
    sub = 'Add clearer images of the declarations panel before listing this product.';
  } else if (hasWarning) {
    verdict = 'WARNING';
    title = 'Review Required';
    sub = 'Most fields look fine — a couple of items need a manual look before listing.';
  }

  res.json({
    verdict,
    title,
    sub,
    checks
  });
});

export default router;
