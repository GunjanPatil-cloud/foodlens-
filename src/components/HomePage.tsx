import React from 'react';
import { PageId, StatsData } from '../types.js';
import { ArrowRight, Check, ScanLine, Upload, ShieldCheck, Scale, BarChart2 } from 'lucide-react';

interface HomePageProps {
  stats: StatsData | null;
  onNavigate: (page: PageId, opts?: { scanTab?: 'barcode' | 'upload' }) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ stats, onNavigate }) => {
  return (
    <div className="animate-fadein">
      {/* Hero Section */}
      <section className="bg-[#f5f7fb] border-b border-slate-200 py-16">
        <div className="wrap grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          <div>
            {stats && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 mb-4 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{stats.totalProducts} Packaged Foods Monitored</span>
                <span className="text-slate-300">|</span>
                <span className="text-emerald-700">{stats.complianceRate}% Compliant</span>
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-extrabold font-['Manrope'] text-slate-900 leading-[1.12] max-w-[14ch]">
              Scan. Understand. Compare. Buy Better.
            </h1>
            <p className="mt-4 text-base md:text-lg text-slate-600 max-w-[46ch] leading-relaxed">
              Understand what's inside your packaged products and identify potential label-compliance issues before you buy.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <button
                onClick={() => onNavigate('scanner', { scanTab: 'barcode' })}
                className="btn btn-primary"
              >
                <ScanLine className="w-4 h-4" />
                <span>Scan Product</span>
              </button>
              <button
                onClick={() => onNavigate('scanner', { scanTab: 'upload' })}
                className="btn btn-outline"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Product Image</span>
              </button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md">
            <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-[#f5f7fb] h-60 flex items-center justify-center overflow-hidden">
              <div className="absolute left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-transparent via-indigo-600 to-transparent animate-scan"></div>
              <div className="flex flex-col items-center gap-2 text-slate-400 text-xs font-medium">
                <ScanLine className="w-8 h-8 text-indigo-400" />
                <span>Live camera scan preview</span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-3.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Sample: NutriCrunch Multigrain Biscuits</span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Compliant</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="wrap py-12">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold font-['Manrope'] text-slate-900">
            What FoodLens checks for you
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            onClick={() => onNavigate('scanner', { scanTab: 'barcode' })}
            className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
              <ScanLine className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-['Manrope'] text-slate-900 mb-1.5">Scan &amp; Extract</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Scan a barcode/QR code or upload package images — front, back, ingredients, and nutrition panels.
            </p>
          </div>

          <div
            onClick={() => onNavigate('scanner', { scanTab: 'upload' })}
            className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-['Manrope'] text-slate-900 mb-1.5">Compliance Check</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Check extracted label information against configured Legal Metrology and food-labelling requirements.
            </p>
          </div>

          <div
            onClick={() => onNavigate('compare')}
            className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-purple-400 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-['Manrope'] text-slate-900 mb-1.5">Compare Products</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Find better-suited alternatives across different price ranges and verified compliance standing.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="wrap py-10 border-t border-slate-200">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold font-['Manrope'] text-slate-900">
            How FoodLens works
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
          <div className="flex flex-col items-center gap-2.5 text-center flex-1">
            <div className="w-14 h-14 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <ScanLine className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900">1. Scan</span>
            <span className="text-xs text-slate-500">Barcode or labels</span>
          </div>

          <ArrowRight className="hidden md:block w-5 h-5 text-slate-300" />

          <div className="flex flex-col items-center gap-2.5 text-center flex-1">
            <div className="w-14 h-14 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900">2. Extract</span>
            <span className="text-xs text-slate-500">OCR &amp; declarations</span>
          </div>

          <ArrowRight className="hidden md:block w-5 h-5 text-slate-300" />

          <div className="flex flex-col items-center gap-2.5 text-center flex-1">
            <div className="w-14 h-14 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900">3. Verify</span>
            <span className="text-xs text-slate-500">LMPC &amp; FSSAI norms</span>
          </div>

          <ArrowRight className="hidden md:block w-5 h-5 text-slate-300" />

          <div className="flex flex-col items-center gap-2.5 text-center flex-1">
            <div className="w-14 h-14 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <BarChart2 className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900">4. Analyze</span>
            <span className="text-xs text-slate-500">Nutrition &amp; claims</span>
          </div>

          <ArrowRight className="hidden md:block w-5 h-5 text-slate-300" />

          <div className="flex flex-col items-center gap-2.5 text-center flex-1">
            <div className="w-14 h-14 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Scale className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900">5. Compare</span>
            <span className="text-xs text-slate-500">Better alternatives</span>
          </div>
        </div>
      </section>
    </div>
  );
};
