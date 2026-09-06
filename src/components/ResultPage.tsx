import React from 'react';
import { Product, PageId } from '../types.js';
import { Check, AlertTriangle, AlertCircle, Info, Package, Leaf, Star } from 'lucide-react';

interface ResultPageProps {
  product: Product;
  onNavigate: (page: PageId) => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({ product, onNavigate }) => {
  const renderBadge = (status: Product['complianceStatus']) => {
    if (status === 'COMPLIANT') {
      return (
        <span className="badge badge-compliant">
          <Check className="w-4 h-4" />
          <span>Compliant</span>
        </span>
      );
    }
    if (status === 'WARNING') {
      return (
        <span className="badge badge-warning">
          <AlertTriangle className="w-4 h-4" />
          <span>Warning</span>
        </span>
      );
    }
    return (
      <span className="badge badge-verify">
        <AlertCircle className="w-4 h-4" />
        <span>Needs Verification</span>
      </span>
    );
  };

  const getStatusTextClass = (status: 'PASS' | 'WARNING' | 'NEEDS VERIFICATION') => {
    if (status === 'PASS') return 'status-pass';
    if (status === 'WARNING') return 'status-warning';
    return 'status-verify';
  };

  const getStatusLabel = (status: 'PASS' | 'WARNING' | 'NEEDS VERIFICATION') => {
    if (status === 'PASS') return 'Pass';
    if (status === 'WARNING') return 'Warning';
    return 'Needs Verification';
  };

  return (
    <div className="wrap py-10 animate-fadein">
      {/* Top Banner Card */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
            <Package className="w-14 h-14 stroke-1 text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-['Manrope'] text-slate-900 mb-1">
              {product.name}
            </h1>
            <div className="text-sm text-slate-500">
              <b className="text-slate-800 font-semibold">{product.brand}</b> · {product.category} · Barcode {product.barcode}
            </div>
            {product.verifiedBySeller && (
              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-full">
                <Check className="w-3 h-3" />
                <span>Verified by Manufacturer</span>
              </div>
            )}
          </div>
        </div>

        <div>
          {renderBadge(product.complianceStatus)}
        </div>
      </div>

      {/* Statutory Disclaimer */}
      <div className="flex items-start gap-2.5 p-3.5 mt-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          This result is a preliminary, automated screening based on extracted label data and Legal Metrology (Packaged Commodities) Rules — not a final legal determination of compliance.
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mt-6 items-start">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Product Details Panel */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <h3 className="text-base font-bold font-['Manrope'] text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <span>Product Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-400 mb-0.5">MRP</div>
                <div className="font-semibold text-slate-900">{product.mrp}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Net Quantity</div>
                <div className="font-semibold text-slate-900">{product.netQty}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Manufacturing Date</div>
                <div className="font-semibold text-slate-900">{product.mfgDate}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Expiry / Best Before</div>
                <div className="font-semibold text-slate-900">{product.expiry}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Origin</div>
                <div className="font-semibold text-slate-900">{product.origin}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-slate-400 mb-0.5">Storage Instructions</div>
                <div className="font-semibold text-slate-900">{product.storage}</div>
              </div>
            </div>
          </div>

          {/* Ingredients Panel */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <h3 className="text-base font-bold font-['Manrope'] text-slate-900 mb-4 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>Ingredients</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.ingredients.map((ing, idx) => (
                <span
                  key={idx}
                  title={ing.note || ''}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    ing.flag
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <span>{ing.name}</span>
                  {ing.flag && <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />}
                </span>
              ))}
            </div>
            {product.ingredientNote && (
              <div className="mt-3 text-xs text-slate-500 font-medium">
                {product.ingredientNote}
              </div>
            )}
          </div>

          {/* Nutrition Panel */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <h3 className="text-base font-bold font-['Manrope'] text-slate-900 mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>Nutrition (per 100 g / 100 ml)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(product.nutrition).slice(0, 5).map(([k, rawVal]) => {
                const v = rawVal as { value: number; unit: string; pct: number };
                return (
                  <div key={k} className="p-3 border border-slate-200 rounded-xl text-center bg-slate-50/50">
                    <div className="text-base font-extrabold font-['Manrope'] text-slate-900">
                      {v.value}
                      <span className="text-[11px] font-normal text-slate-400"> {v.unit}</span>
                    </div>
                    <div className="text-xs text-slate-500 capitalize mt-0.5">{k}</div>
                    <div className="h-1.5 rounded-full bg-slate-200 mt-2 overflow-hidden">
                      <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, v.pct)}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Claims Analysis Panel */}
          {product.claims && product.claims.length > 0 && (
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <h3 className="text-base font-bold font-['Manrope'] text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-600" />
                <span>Claim Analysis</span>
              </h3>
              <div className="space-y-3">
                {product.claims.map((c, idx) => (
                  <div key={idx} className="p-3.5 border border-slate-200 rounded-xl">
                    <div className="flex justify-between items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">"{c.claim}"</span>
                      <span className={`text-xs font-bold ${getStatusTextClass(c.status)}`}>
                        {getStatusLabel(c.status)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {c.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance Checklist Table */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <h3 className="text-base font-bold font-['Manrope'] text-slate-900 mb-4 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Legal Metrology &amp; FSSAI Checklist</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-400">
                    <th className="pb-3 px-3">Requirement</th>
                    <th className="pb-3 px-3">Extracted Value</th>
                    <th className="pb-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {product.checklist.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-medium text-slate-800">{item.req}</td>
                      <td className="py-3 px-3 text-slate-600 text-xs">{item.val}</td>
                      <td className="py-3 px-3">
                        <span className={`text-xs font-bold ${getStatusTextClass(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: At a Glance Card */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs sticky top-24 space-y-4">
          <h3 className="text-base font-bold font-['Manrope'] text-slate-900">
            At a glance
          </h3>

          <div className="divide-y divide-slate-100 text-sm">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">Overall status</span>
              <div>{renderBadge(product.complianceStatus)}</div>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">Customer rating</span>
              <div className="flex items-center gap-1 font-bold text-slate-900">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{product.rating}</span>
                <span className="text-slate-400 font-normal text-xs">({product.reviewCount})</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">Category</span>
              <span className="font-semibold text-slate-800">{product.category}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => onNavigate('compare')}
              className="btn btn-primary w-full justify-center text-sm"
            >
              Compare Alternatives
            </button>
            <button
              onClick={() => onNavigate('manufacturer')}
              className="btn btn-outline w-full justify-center text-sm"
            >
              View Manufacturer
            </button>
            <button
              onClick={() => onNavigate('reviews')}
              className="btn btn-ghost w-full justify-center text-sm"
            >
              Customer Reviews
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
