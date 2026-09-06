import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Product } from '../types.js';
import { Upload, Check, AlertTriangle, AlertCircle, ShieldCheck, Sparkles, PlusCircle } from 'lucide-react';

interface SellerPageProps {
  onProductCreated?: (newProduct: Product) => void;
}

const SELLER_SLOT_DEFS = [
  { key: 'front', label: 'Front Panel' },
  { key: 'back', label: 'Back Panel' },
  { key: 'panel', label: 'Declarations Panel' }
];

interface SellerSlotItem {
  file?: File;
  previewUrl?: string;
}

export const SellerPage: React.FC<SellerPageProps> = ({ onProductCreated }) => {
  const { user, openAuthModal } = useAuth();

  // Slots
  const [slots, setSlots] = useState<Record<string, SellerSlotItem>>({});

  // Product metadata
  const [productName, setProductName] = useState('NutriBake Organic Ragi Crisps');
  const [brand, setBrand] = useState(user?.role === 'seller' ? user.name : 'NutriBake Organics');
  const [category, setCategory] = useState('Biscuits & Snacks');
  const [mrp, setMrp] = useState('₹60.00');
  const [netQty, setNetQty] = useState('150 g');
  const [fssaiNumber, setFssaiNumber] = useState('11520021000345');

  // Verification result state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verdict: 'PASS' | 'WARNING' | 'FAIL';
    title: string;
    sub: string;
    checks: { label: string; status: string }[];
  } | null>(null);

  // Persistence state
  const [isSaving, setIsSaving] = useState(false);
  const [savedProduct, setSavedProduct] = useState<Product | null>(null);

  const handleSlotChange = (key: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setSlots(prev => ({
      ...prev,
      [key]: { file, previewUrl }
    }));
  };

  const handleRunVerification = async () => {
    const hasAnyImage = (Object.values(slots) as SellerSlotItem[]).some(s => s?.previewUrl);
    if (!hasAnyImage) {
      alert('Please upload at least one package image before running pre-listing verification.');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const boolSlots = {
        front: !!slots.front?.previewUrl,
        back: !!slots.back?.previewUrl,
        panel: !!slots.panel?.previewUrl
      };

      const result = await api.verifySellerListing({
        slots: boolSlots,
        productName,
        brand,
        mrp,
        netQty
      });

      setVerificationResult(result);
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveToCatalog = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    setIsSaving(true);
    try {
      const newProduct = await api.createProduct({
        name: productName,
        brand,
        category,
        mrp,
        netQty,
        origin: 'Made in India',
        storage: 'Store in a cool dry place',
        fssaiNumber
      } as Partial<Product>);

      setSavedProduct(newProduct);
      if (onProductCreated) onProductCreated(newProduct);
    } catch (err) {
      console.error('Save product error:', err);
      alert('Could not save product to catalog. Please ensure fields are valid.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="wrap py-10 animate-fadein">
      {/* Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-7 md:p-8 text-white mb-8 shadow-md">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Seller &amp; Brand Portal</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold font-['Manrope'] text-white">
          Pre-Listing Label Verification
        </h2>
        <p className="mt-2 text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
          Upload your product's package images before listing. FoodLens screens them against mandatory Legal Metrology declarations and FSSAI norms so you can catch issues before a buyer does.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Form & Uploads */}
        <div className="space-y-6">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <h3 className="font-bold text-base font-['Manrope'] text-slate-900 mb-1">
              1. Upload Package Label Images
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Front panel, back panel, and statutory declarations view.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {SELLER_SLOT_DEFS.map(slot => {
                const s = slots[slot.key];
                return (
                  <label
                    key={slot.key}
                    className={`relative aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all overflow-hidden ${
                      s?.previewUrl
                        ? 'border-emerald-500 bg-emerald-50/20'
                        : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleSlotChange(slot.key, e.target.files[0]);
                        }
                      }}
                    />
                    {s?.previewUrl ? (
                      <>
                        <img
                          src={s.previewUrl}
                          alt={slot.label}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-xs font-bold text-slate-700">{slot.label}</span>
                        <span className="text-[10px] text-slate-400">tap to add</span>
                      </>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Product Details Inputs */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <h3 className="font-bold text-base font-['Manrope'] text-slate-900 mb-3">
              2. Product Declarations
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">MRP (incl. taxes)</label>
                  <input
                    type="text"
                    value={mrp}
                    onChange={e => setMrp(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Net Quantity</label>
                  <input
                    type="text"
                    value={netQty}
                    onChange={e => setNetQty(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">FSSAI License Number</label>
                <input
                  type="text"
                  value={fssaiNumber}
                  onChange={e => setFssaiNumber(e.target.value)}
                  placeholder="14-digit FSSAI number"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={handleRunVerification}
                disabled={isVerifying}
                className="btn btn-primary w-full justify-center"
              >
                {isVerifying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Screening Label...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Verification Check</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Verification Results */}
        <div className="space-y-6">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <h3 className="font-bold text-base font-['Manrope'] text-slate-900 mb-3">
              3. Verification Checklist
            </h3>

            {!verificationResult ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                Upload package images and click "Run Verification Check" to test your label against mandatory declarations.
              </div>
            ) : (
              <div className="space-y-4 animate-fadein">
                {/* Result Verdict Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    verificationResult.verdict === 'PASS'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : verificationResult.verdict === 'WARNING'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  {verificationResult.verdict === 'PASS' ? (
                    <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : verificationResult.verdict === 'WARNING' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-sm">{verificationResult.title}</div>
                    <div className="text-xs opacity-90 mt-0.5">{verificationResult.sub}</div>
                  </div>
                </div>

                {/* Checklist Rows */}
                <div className="space-y-2">
                  {verificationResult.checks.map((c, i) => {
                    const isPass = c.status === 'PASS';
                    const isWarn = c.status === 'WARNING';
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              isPass
                                ? 'bg-emerald-100 text-emerald-700'
                                : isWarn
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {isPass ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : isWarn ? (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <span className="font-semibold text-slate-800">{c.label}</span>
                        </div>

                        <span
                          className={`font-bold ${
                            isPass ? 'text-emerald-700' : isWarn ? 'text-amber-700' : 'text-red-700'
                          }`}
                        >
                          {c.status.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Save to Catalog Button */}
                <div className="pt-3">
                  <button
                    onClick={handleSaveToCatalog}
                    disabled={isSaving || !!savedProduct}
                    className="btn btn-outline w-full justify-center text-sm border-emerald-600 text-emerald-800 hover:bg-emerald-50"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>
                      {isSaving
                        ? 'Registering into Database...'
                        : savedProduct
                        ? '✓ Saved to Live Product Database'
                        : 'Save & Publish to FoodLens Database'}
                    </span>
                  </button>
                  {savedProduct && (
                    <div className="text-[11px] text-emerald-700 text-center mt-1.5 font-semibold">
                      Product ID: {savedProduct.id} · Barcode: {savedProduct.barcode}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
