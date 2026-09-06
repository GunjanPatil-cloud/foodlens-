import React from 'react';
import { Manufacturer, Product } from '../types.js';
import { Building2, Info, Package, ShieldCheck } from 'lucide-react';

interface ManufacturerPageProps {
  manufacturer: Manufacturer | null;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const ManufacturerPage: React.FC<ManufacturerPageProps> = ({
  manufacturer,
  products,
  onSelectProduct
}) => {
  if (!manufacturer) {
    return (
      <div className="wrap py-16 text-center text-slate-500">
        Loading manufacturer information...
      </div>
    );
  }

  const manufacturerProducts = products.filter(p =>
    manufacturer.productIds.includes(p.id) || p.manufacturerId === manufacturer.id
  );

  return (
    <div className="wrap py-10 animate-fadein">
      {/* Manufacturer Header Card */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-['Manrope'] font-extrabold text-2xl shrink-0">
          {manufacturer.name.charAt(0)}
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-extrabold font-['Manrope'] text-slate-900">
            {manufacturer.name}
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            {manufacturer.address}
          </p>
          {manufacturer.fssaiLicense && (
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>FSSAI License: {manufacturer.fssaiLicense}</span>
            </div>
          )}
        </div>
      </div>

      {/* Company Info Panel */}
      <div className="mt-6 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <h3 className="text-base font-bold font-['Manrope'] text-slate-900 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-600" />
          <span>Company Information</span>
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          {manufacturer.info}
        </p>
      </div>

      {/* Other Products Panel */}
      <div className="mt-6 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <h3 className="text-base font-bold font-['Manrope'] text-slate-900 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-indigo-600" />
          <span>Products from this manufacturer ({manufacturerProducts.length})</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {manufacturerProducts.map(p => (
            <button
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className="p-4 border border-slate-200 rounded-xl text-center bg-white hover:border-indigo-400 hover:shadow-xs transition-all text-left group"
            >
              <div className="w-full h-20 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 mb-2.5 group-hover:bg-indigo-50/50 transition-colors">
                <Package className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="font-bold text-xs text-slate-900 line-clamp-2 mb-1">
                {p.name}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold">
                {p.mrp} · <span className="capitalize">{p.complianceStatus.toLowerCase()}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
