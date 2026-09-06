import React from 'react';
import { Info, ShieldCheck, Scale, Cpu, Database, ScanLine } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="wrap py-10 max-w-3xl animate-fadein">
      <h2 className="text-3xl font-extrabold font-['Manrope'] text-slate-900">
        About FoodLens
      </h2>

      <div className="space-y-4 text-slate-600 text-sm md:text-base leading-relaxed mt-4">
        <p>
          FoodLens helps everyday shoppers and conscious consumers understand packaged food and consumer products before they buy — by scanning a barcode or package photos and surfacing the label details that matter: net quantity, MRP, manufacturing and expiry dates, ingredient disclosures, nutrition percentages, and marketing claim substantiations.
        </p>
        <p>
          The compliance checks are configured against the statutory requirements of the <b>Legal Metrology (Packaged Commodities) Rules, 2011</b> and the <b>FSSAI (Labelling and Display) Regulations, 2020</b> as an automated preliminary screening engine.
        </p>
      </div>

      {/* Technical Architecture matching SIH 2026 Team Zenith image */}
      <div className="mt-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <h3 className="text-lg font-bold font-['Manrope'] text-slate-900 mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600" />
          <span>Technical Architecture (SIH 2026 — Team Zenith)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-[#f5f7fb] border border-slate-200 rounded-xl">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1 text-sm">
              <ScanLine className="w-4 h-4 text-indigo-600" />
              <span>1. Image &amp; OCR Pipeline</span>
            </div>
            <p className="text-slate-600">
              Captures package photos (front, back, nutrition panel) and extracts declarations via Optical Character Recognition (OCR) with pre-processing enhancement.
            </p>
          </div>

          <div className="p-3.5 bg-[#f5f7fb] border border-slate-200 rounded-xl">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1 text-sm">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>2. Rule-Based Compliance Engine</span>
            </div>
            <p className="text-slate-600">
              Evaluates mandatory label fields: Net Quantity in metric units, MRP inclusive of taxes, Mfg &amp; Expiry dates, FSSAI 14-digit license, and marketing claims against regulatory limits.
            </p>
          </div>

          <div className="p-3.5 bg-[#f5f7fb] border border-slate-200 rounded-xl">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1 text-sm">
              <Database className="w-4 h-4 text-purple-600" />
              <span>3. Central Database &amp; Real-Time Sync</span>
            </div>
            <p className="text-slate-600">
              Stores verified product catalogs, manufacturer licenses, customer reviews, and scan audits with real-time updates via Server-Sent Events (SSE).
            </p>
          </div>

          <div className="p-3.5 bg-[#f5f7fb] border border-slate-200 rounded-xl">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1 text-sm">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>4. Secure Role Authentication</span>
            </div>
            <p className="text-slate-600">
              Protects sensitive user data and seller submissions with encrypted JWT auth, separating Consumer, Verified Brand Seller, and Regulatory Officer workflows.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 mt-6 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <b>Statutory Notice:</b> FoodLens provides an automated assessment based on visible package images and stated declarations. It does not replace official lab testing or statutory certification by Legal Metrology inspectors.
        </div>
      </div>
    </div>
  );
};
