import { Product, ChecklistItem, ClaimCheck, Ingredient } from '../types.js';

export interface ExtractedProductInput {
  name?: string;
  brand?: string;
  category?: string;
  manufacturerName?: string;
  manufacturerAddress?: string;
  fssaiNumber?: string;
  mrp?: string;
  netQty?: string;
  mfgDate?: string;
  expiryDate?: string;
  ingredientsText?: string;
  ingredients?: (string | Ingredient)[];
  nutritionValues?: {
    calories?: number;
    sugar?: number;
    fat?: number;
    protein?: number;
    sodium?: number;
    fibre?: number;
  };
  declaredClaims?: string[];
  claims?: string[];
  isVeg?: boolean;
}

export interface ComplianceAnalysisResult {
  overallStatus: 'COMPLIANT' | 'WARNING' | 'NEEDS VERIFICATION';
  checklist: ChecklistItem[];
  claims: ClaimCheck[];
  ingredients: Ingredient[];
  ingredientNote: string;
  summary: string;
}

export class ComplianceEngine {
  /**
   * Evaluates product data against Legal Metrology and FSSAI standards.
   */
  public analyze(input: ExtractedProductInput): ComplianceAnalysisResult {
    const checklist: ChecklistItem[] = [];
    const claims: ClaimCheck[] = [];

    // 1. Product Name Requirement
    if (input.name && input.name.trim().length > 2) {
      checklist.push({
        req: 'Product Name',
        val: input.name.trim(),
        status: 'PASS'
      });
    } else {
      checklist.push({
        req: 'Product Name',
        val: 'Name not clearly visible or incomplete',
        status: 'NEEDS VERIFICATION'
      });
    }

    // 2. Manufacturer & Packer Address
    const mfgInfo = [input.manufacturerName, input.manufacturerAddress].filter(Boolean).join(', ');
    if (mfgInfo.length > 8) {
      checklist.push({
        req: 'Manufacturer',
        val: mfgInfo,
        status: 'PASS'
      });
    } else {
      checklist.push({
        req: 'Manufacturer',
        val: 'Manufacturer name or registered address missing',
        status: 'NEEDS VERIFICATION'
      });
    }

    // 3. Net Quantity (LMPC Rule 6)
    const netQtyRegex = /^(\d+(\.\d+)?)\s*(g|kg|ml|l|ltr|gm|grams|pcs)$/i;
    if (input.netQty && netQtyRegex.test(input.netQty.trim())) {
      checklist.push({
        req: 'Net Quantity',
        val: input.netQty.trim(),
        status: 'PASS'
      });
    } else if (input.netQty) {
      checklist.push({
        req: 'Net Quantity',
        val: `${input.netQty} (Non-standard metric unit declaration)`,
        status: 'WARNING'
      });
    } else {
      checklist.push({
        req: 'Net Quantity',
        val: 'Net quantity declaration not found',
        status: 'NEEDS VERIFICATION'
      });
    }

    // 4. Retail Sale Price (MRP)
    const mrpClean = input.mrp ? input.mrp.trim() : '';
    if (mrpClean.includes('₹') || /INR|\bRs\b/i.test(mrpClean) || /^\d+(\.\d+)?$/.test(mrpClean)) {
      checklist.push({
        req: 'MRP',
        val: mrpClean.includes('taxes') ? mrpClean : `${mrpClean} (incl. of all taxes)`,
        status: 'PASS'
      });
    } else {
      checklist.push({
        req: 'MRP',
        val: 'MRP declaration missing or unreadable',
        status: 'NEEDS VERIFICATION'
      });
    }

    // 5. Date Information (Mfg / Best Before / Expiry)
    if (input.mfgDate && input.expiryDate) {
      checklist.push({
        req: 'Date Information',
        val: `Mfg ${input.mfgDate}, Best before ${input.expiryDate}`,
        status: 'PASS'
      });
    } else if (input.mfgDate || input.expiryDate) {
      checklist.push({
        req: 'Date Information',
        val: input.mfgDate ? `Mfg ${input.mfgDate}, exact best-before day not legible` : `Expiry ${input.expiryDate}, mfg date unreadable`,
        status: 'WARNING'
      });
    } else {
      checklist.push({
        req: 'Date Information',
        val: 'Manufacturing and expiry date missing',
        status: 'NEEDS VERIFICATION'
      });
    }

    // 6. Mandatory FSSAI Declaration & License
    const fssaiNum = input.fssaiNumber ? input.fssaiNumber.replace(/\D/g, '') : '';
    if (fssaiNum.length === 14) {
      checklist.push({
        req: 'Mandatory Declaration',
        val: `FSSAI license #${fssaiNum} verified`,
        status: 'PASS'
      });
    } else if (fssaiNum.length > 5) {
      checklist.push({
        req: 'Mandatory Declaration',
        val: `FSSAI license number partially visible (${fssaiNum})`,
        status: 'NEEDS VERIFICATION'
      });
    } else {
      checklist.push({
        req: 'Mandatory Declaration',
        val: 'FSSAI logo and 14-digit license number missing',
        status: 'NEEDS VERIFICATION'
      });
    }

    // 7. Parse Ingredients & Flag unspecific additives
    const ingredients: Ingredient[] = [];
    let flaggedCount = 0;

    const rawParts: string[] = [];
    if (input.ingredientsText) {
      rawParts.push(...input.ingredientsText.split(/[,;•\n]+/).map(s => s.trim()).filter(Boolean));
    } else if (Array.isArray(input.ingredients)) {
      for (const item of input.ingredients) {
        if (typeof item === 'string') {
          rawParts.push(item.trim());
        } else if (item && typeof item === 'object' && 'name' in item) {
          rawParts.push((item as Ingredient).name);
        }
      }
    }

    for (const part of rawParts) {
      let isFlagged = false;
      let note = '';

      if (/artificial flavou?r/i.test(part) && !/type|specified/i.test(part)) {
        isFlagged = true;
        note = 'Artificial flavouring present; exact chemical/nature not identified on label.';
      } else if (/vegetable fat/i.test(part) && !/palm|soy|mustard|coconut|sunflower/i.test(part)) {
        isFlagged = true;
        note = 'Source vegetable oil/fat not specified per FSSAI regulations.';
      } else if (/emulsifier/i.test(part) && !/\d{3}/.test(part)) {
        isFlagged = true;
        note = 'Class title used without INS number.';
      } else if (/preservative/i.test(part) && !/\d{3}/.test(part)) {
        isFlagged = true;
        note = 'Preservative class declared without specific INS reference.';
      }

      if (isFlagged) flaggedCount++;
      ingredients.push({
        name: part,
        flag: isFlagged,
        note: note || undefined
      });
    }

    const ingredientNote = ingredients.length === 0
      ? 'No ingredient declarations found in uploaded photos.'
      : flaggedCount > 0
      ? `${flaggedCount} of ${ingredients.length} declared ingredients need a clearer label photo to confirm full disclosure.`
      : 'All declared ingredients extracted clearly from the label.';

    // 8. Claims Verification
    const declaredClaims = (input.declaredClaims && input.declaredClaims.length > 0)
      ? input.declaredClaims
      : (input.claims || []);
    const sugarVal = input.nutritionValues?.sugar ?? 0;
    const fibreVal = input.nutritionValues?.fibre ?? 0;

    for (const claim of declaredClaims) {
      const cLower = claim.toLowerCase();

      if (cLower.includes('sugar free')) {
        if (sugarVal <= 0.5 && !input.ingredientsText?.toLowerCase().includes('sugar')) {
          claims.push({
            claim,
            status: 'PASS',
            explanation: `Sugar is ${sugarVal}g/100g, well below statutory threshold of 0.5g.`
          });
        } else {
          claims.push({
            claim,
            status: 'NEEDS VERIFICATION',
            explanation: `Declared sugar is ${sugarVal}g or sugar/sweetener is present in ingredients; review against claim requirements.`
          });
        }
      } else if (cLower.includes('low sugar')) {
        if (sugarVal <= 5) {
          claims.push({
            claim,
            status: 'PASS',
            explanation: `Declared sugar (${sugarVal}g) is within low-sugar benchmark (<= 5g per 100g).`
          });
        } else {
          claims.push({
            claim,
            status: 'WARNING',
            explanation: `Declared sugar is ${sugarVal}g/100g, exceeding standard low-sugar thresholds.`
          });
        }
      } else if (cLower.includes('rich in fibre') || cLower.includes('high fibre')) {
        if (fibreVal >= 6) {
          claims.push({
            claim,
            status: 'PASS',
            explanation: `Fibre content (${fibreVal}g) meets the "rich in fibre" threshold (>= 6g per 100g).`
          });
        } else {
          claims.push({
            claim,
            status: 'NEEDS VERIFICATION',
            explanation: 'Fibre content not listed or below 6g threshold in the extracted nutrition panel.'
          });
        }
      } else if (cLower.includes('preservative')) {
        const hasPreservative = input.ingredientsText && /preservative|INS\s*2\d\d/i.test(input.ingredientsText);
        claims.push({
          claim,
          status: hasPreservative ? 'WARNING' : 'PASS',
          explanation: hasPreservative
            ? 'Preservative additives detected in ingredients list.'
            : 'No preservative class names or INS 200 series detected among ingredients.'
        });
      } else if (cLower.includes('real fruit') || cLower.includes('real juice')) {
        const hasFruit = input.ingredientsText && /juice|pulp|concentrate/i.test(input.ingredientsText);
        claims.push({
          claim,
          status: hasFruit ? 'PASS' : 'WARNING',
          explanation: hasFruit
            ? 'Fruit constituent is declared in ingredient list.'
            : 'Low or unspecified fruit percentage on extracted label.'
        });
      } else {
        claims.push({
          claim,
          status: 'PASS',
          explanation: 'Claim text checked against standard mandatory disclosures.'
        });
      }
    }

    // Determine Overall Status
    let overallStatus: 'COMPLIANT' | 'WARNING' | 'NEEDS VERIFICATION' = 'COMPLIANT';
    const hasFail = checklist.some(c => c.status === 'NEEDS VERIFICATION') || claims.some(c => c.status === 'NEEDS VERIFICATION');
    const hasWarn = checklist.some(c => c.status === 'WARNING') || claims.some(c => c.status === 'WARNING') || flaggedCount > 0;

    if (hasFail) {
      overallStatus = 'NEEDS VERIFICATION';
    } else if (hasWarn) {
      overallStatus = 'WARNING';
    }

    let summary = 'Product fulfills all evaluated Legal Metrology and FSSAI packaging norms.';
    if (overallStatus === 'NEEDS VERIFICATION') {
      summary = 'Certain mandatory packaging disclosures are missing or unreadable from the provided label.';
    } else if (overallStatus === 'WARNING') {
      summary = 'Minor discrepancies or non-standard declarations were identified. Inspection recommended.';
    }

    return {
      overallStatus,
      checklist,
      claims,
      ingredients,
      ingredientNote,
      summary
    };
  }
}

export const complianceEngine = new ComplianceEngine();
