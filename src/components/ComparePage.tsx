import React, { useState, useMemo } from 'react';
import { Product } from '../types.js';
import { Package, Star, Check, AlertTriangle, AlertCircle } from 'lucide-react';

interface ComparePageProps {
  products: Product[];
  currentProductId: string;
  onSelectProduct: (product: Product) => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({
  products,
  currentProductId,
  onSelectProduct
}) => {
  const currentProduct = useMemo(() => {
    return products.find(p => p.id === currentProductId) || products[0];
  }, [products, currentProductId]);

  const [priceFilter, setPriceFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>(currentProduct?.category || '');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [complianceFilter, setComplianceFilter] = useState<string>('');

  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category)));
  }, [products]);

  const brands = useMemo(() => {
    return Array.from(new Set(products.map(p => p.brand)));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category
      if (categoryFilter && p.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      // Brand
      if (brandFilter && p.brand.toLowerCase() !== brandFilter.toLowerCase()) return false;
      // Compliance
      if (complianceFilter && p.complianceStatus !== complianceFilter) return false;
      // Price
      if (priceFilter) {
        const num = parseFloat(p.mrp.replace(/[^\d.]/g, ''));
        const [lo, hi] = priceFilter.split('-').map(Number);
        if (num < lo || num > hi) return false;
      }
      return true;
    });
  }, [products, categoryFilter, brandFilter, complianceFilter, priceFilter]);

  // Find the "Better Alternative" among competitors
  const bestAlternative = useMemo(() => {
    const others = filteredProducts.filter(p => p.id !== currentProduct?.id);
    if (others.length === 0) return null;
    return [...others].sort((a, b) => {
      // Higher rating or compliant status
      if (a.complianceStatus === 'COMPLIANT' && b.complianceStatus !== 'COMPLIANT') return -1;
      if (b.complianceStatus === 'COMPLIANT' && a.complianceStatus !== 'COMPLIANT') return 1;
      return b.rating - a.rating;
    })[0];
  }, [filteredProducts, currentProduct]);

  // Display current product first, then the filtered competitors
  const displayList = useMemo(() => {
    const list: Product[] = [];
    if (currentProduct) list.push(currentProduct);
    filteredProducts.forEach(p => {
      if (p.id !== currentProduct?.id) list.push(p);
    });
    return list;
  }, [currentProduct, filteredProducts]);

  return (
    <div className="wrap py-10 animate-fadein">
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-['Manrope'] text-slate-900">
            Compare alternatives
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            See how the scanned product stacks up against similar options in the database.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-[#f5f7fb] border border-slate-200 rounded-xl text-xs">
        <select
          value={priceFilter}
          onChange={e => setPriceFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
        >
          <option value="">All price ranges</option>
          <option value="0-50">Under ₹50</option>
          <option value="50-100">₹50 – ₹100</option>
          <option value="100-999">Above ₹100</option>
        </select>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
        >
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={brandFilter}
          onChange={e => setBrandFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
        >
          <option value="">All brands</option>
          {brands.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select
          value={complianceFilter}
          onChange={e => setComplianceFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
        >
          <option value="">All compliance statuses</option>
          <option value="COMPLIANT">Compliant</option>
          <option value="WARNING">Warning</option>
          <option value="NEEDS VERIFICATION">Needs verification</option>
        </select>

        <div className="ml-auto text-slate-500 font-semibold">
          {displayList.length} product{displayList.length === 1 ? '' : 's'} available
        </div>
      </div>

      {/* Comparison Cards Horizontal Track */}
      <div className="overflow-x-auto pb-4 mt-6">
        <div className="flex gap-4 min-w-min">
          {displayList.map(p => {
            const isSelf = p.id === currentProduct?.id;
            const isBest = bestAlternative && p.id === bestAlternative.id;

            return (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className={`relative w-[240px] shrink-0 p-5 rounded-2xl border-2 cursor-pointer transition-all shadow-xs hover:shadow-md hover:-translate-y-1 ${
                  isSelf
                    ? 'bg-indigo-50/50 border-indigo-500'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {isBest && (
                  <span className="absolute -top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                    Better Alternative
                  </span>
                )}

                <div className="w-full h-24 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <Package className="w-8 h-8" />
                </div>

                <h4 className="font-bold text-sm font-['Manrope'] text-slate-900 truncate mb-0.5" title={p.name}>
                  {p.name}
                </h4>
                <div className="text-xs text-slate-500 mb-3">
                  {p.brand} {isSelf && '· Scanned'}
                </div>

                <div className="text-xl font-extrabold font-['Manrope'] text-slate-900 mb-2">
                  {p.mrp}
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Net Qty</span>
                    <span className="font-semibold text-slate-800">{p.netQty}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Sugar</span>
                    <span className="font-semibold text-slate-800">{p.nutrition?.sugar?.value} g</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Calories</span>
                    <span className="font-semibold text-slate-800">{p.nutrition?.calories?.value} kcal</span>
                  </div>
                  <div className="flex justify-between py-1.5 items-center">
                    <span className="text-slate-500">Status</span>
                    <span className="font-bold flex items-center gap-1">
                      {p.complianceStatus === 'COMPLIANT' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Compliant</span>
                        </>
                      ) : p.complianceStatus === 'WARNING' ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span className="text-amber-700">Warning</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-red-600" />
                          <span className="text-red-700">Check</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 items-center">
                    <span className="text-slate-500">Rating</span>
                    <span className="font-bold text-slate-800 flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{p.rating}</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full mt-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  Inspect Label
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
