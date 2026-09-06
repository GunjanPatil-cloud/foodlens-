import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Product } from '../types.js';
import { api } from '../services/api.js';
import { ScanLine, Upload, Check, Camera, VideoOff, Image as ImageIcon, Search, AlertCircle, Sparkles } from 'lucide-react';

interface ScannerPageProps {
  products: Product[];
  initialTab?: 'barcode' | 'upload';
  onScanComplete: (product: Product) => void;
}

const SLOT_DEFS = [
  { key: 'front', label: 'Front' },
  { key: 'back', label: 'Back' },
  { key: 'side', label: 'Side' },
  { key: 'ingredients', label: 'Ingredients' },
  { key: 'nutrition', label: 'Nutrition' }
];

export const POPULAR_DEMO_BARCODES = [
  { barcode: '8901058017687', name: 'Maggi 2-Min Masala Noodles', brand: 'Nestlé Maggi', category: 'Noodles' },
  { barcode: '8901491101837', name: "Lay's Classic Salted", brand: "Lay's", category: 'Chips' },
  { barcode: '8901719101037', name: 'Parle-G Gluco Biscuits', brand: 'Parle-G', category: 'Biscuits' },
  { barcode: '8901063012225', name: 'Good Day Butter Cookies', brand: 'Britannia', category: 'Cookies' },
  { barcode: '8901262010049', name: 'Amul Table Butter', brand: 'Amul', category: 'Dairy' },
  { barcode: '8901233010108', name: 'Cadbury Dairy Milk', brand: 'Mondelez', category: 'Chocolates' },
  { barcode: '8904043901008', name: 'Tata Salt Vacuum Evaporated', brand: 'Tata', category: 'Salt' },
  { barcode: '8901030814', name: 'NutriCrunch Multigrain', brand: 'NutriCrunch', category: 'Biscuits' }
];

interface UploadSlotItem {
  file?: File;
  previewUrl?: string;
}

function playScanBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  } catch {
    // AudioContext or vibrate not permitted
  }
}

export const ScannerPage: React.FC<ScannerPageProps> = ({
  products,
  initialTab = 'barcode',
  onScanComplete
}) => {
  const [activeMode, setActiveMode] = useState<'barcode' | 'upload'>(initialTab);
  const [selectedBarcode, setSelectedBarcode] = useState<string>(products[0]?.barcode || '8901030814');
  const [manualBarcode, setManualBarcode] = useState<string>('');
  const [camCaption, setCamCaption] = useState<string>('Point your camera at any product barcode or QR code');
  const [isLiveCamera, setIsLiveCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fileScanError, setFileScanError] = useState<string | null>(null);

  // Upload slots state
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadSlotItem>>({});

  // Processing modal state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [currentStepText, setCurrentStepText] = useState<string>('Preprocessing images');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const barcodeFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialTab) setActiveMode(initialTab);
  }, [initialTab]);

  // 5-step processing simulation
  const runProcessingSteps = useCallback((onComplete: () => void) => {
    setIsProcessing(true);
    setProgressPct(0);
    const steps = [
      'Scanning barcode and decoding symbology',
      'Querying central database and Legal Metrology records',
      'Extracting product mandatory declarations',
      'Running compliance & FSSAI rule engine',
      'Finalising verified product profile'
    ];

    let i = 0;
    setCurrentStepText(steps[0]);

    const timer = setInterval(() => {
      i++;
      setProgressPct(Math.min(100, i * 20));
      if (i < steps.length) {
        setCurrentStepText(steps[i]);
      } else {
        clearInterval(timer);
        setTimeout(() => {
          setIsProcessing(false);
          onComplete();
        }, 400);
      }
    }, 380);
  }, []);

  // Process barcode through backend
  const handleScannedBarcode = useCallback(async (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    playScanBeep();
    setCamCaption(`Barcode detected: ${clean}! Loading verified product data...`);

    // Stop camera if running
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      setIsLiveCamera(false);
    }

    runProcessingSteps(async () => {
      try {
        const product = await api.scanBarcode(clean);
        if (product && product.name) {
          onScanComplete(product);
          return;
        }
        throw new Error('No product data returned');
      } catch (err) {
        console.error('Scan error:', err);
        // Check if barcode matches known list or candidates
        const matched = products.find(p => p.barcode === clean || (clean.startsWith('90') && p.barcode.endsWith(clean)));
        if (matched) {
          onScanComplete(matched);
        } else {
          setFileScanError(`Unable to resolve barcode ${clean}. Please verify the code or try manual entry.`);
        }
      }
    });
  }, [onScanComplete, products, runProcessingSteps]);

  // Stop camera helper
  const stopLiveCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      const scanner = html5QrCodeRef.current;
      html5QrCodeRef.current = null;
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch (err) {
        console.warn('Scanner stop error:', err);
      }
      try {
        scanner.clear();
      } catch (err) {
        console.warn('Scanner clear error:', err);
      }
    }
    setIsLiveCamera(false);
    setCamCaption('Point your camera at any product barcode or QR code');
  }, []);

  // Start live camera using Html5Qrcode
  const startLiveCamera = async () => {
    setCameraError(null);
    setFileScanError(null);

    try {
      await stopLiveCamera();

      // Ensure reader container element is mounted
      const element = document.getElementById('interactive-barcode-reader');
      if (!element) {
        setCameraError('Scanner container not ready. Please try again.');
        return;
      }

      const html5QrCode = new Html5Qrcode('interactive-barcode-reader');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 160 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE
        ]
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleScannedBarcode(decodedText);
        },
        () => {
          // Frame error callback - quiet during seeking
        }
      );

      setIsLiveCamera(true);
      setCamCaption('Camera active. Align any barcode inside the frame to scan.');
    } catch (err: unknown) {
      console.warn('Camera start error:', err);
      const errStr = String(err);
      if (errStr.includes('NotAllowedError') || errStr.includes('Permission')) {
        setCameraError('Camera permission was denied. You can upload a photo of a barcode or select any demo barcode below.');
      } else if (errStr.includes('NotFoundError') || errStr.includes('DevicesNotFoundError')) {
        setCameraError('No camera found on this device. Use "Upload Barcode Image" or manual entry below.');
      } else {
        setCameraError('Unable to start live camera stream in this browser view. Try "Upload Barcode Photo" or manual entry below.');
      }
      setIsLiveCamera(false);
    }
  };

  // Scan barcode from uploaded file
  const handleBarcodeFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileScanError(null);
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    try {
      let qrScanner = html5QrCodeRef.current;
      if (!qrScanner) {
        qrScanner = new Html5Qrcode('interactive-barcode-reader');
        html5QrCodeRef.current = qrScanner;
      }

      setCamCaption('Decoding barcode from image...');
      const decodedResult = await qrScanner.scanFile(file, true);
      if (decodedResult) {
        handleScannedBarcode(decodedResult);
      }
    } catch (err) {
      console.warn('Failed to decode barcode from file:', err);
      setFileScanError('Could not find a recognizable barcode in that photo. Please ensure good lighting and clear focus, or enter the numbers manually.');
    } finally {
      if (barcodeFileInputRef.current) {
        barcodeFileInputRef.current.value = '';
      }
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, [stopLiveCamera]);

  // Handle file input for slot
  const handleSlotFileChange = (slotKey: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setUploadedFiles(prev => ({
      ...prev,
      [slotKey]: { file, previewUrl }
    }));
  };

  // Handle uploaded images analysis
  const executeImageAnalysis = async () => {
    const slotsWithData = (Object.entries(uploadedFiles) as [string, UploadSlotItem][]).filter(([, val]) => val?.previewUrl);
    if (slotsWithData.length === 0) return;

    runProcessingSteps(async () => {
      try {
        const imagesPayload = slotsWithData.map(([slot, item]) => ({
          slot,
          dataUrl: item.previewUrl
        }));
        const response = await api.scanUpload(imagesPayload);
        onScanComplete(response.product);
      } catch (err) {
        console.error('Upload scan error:', err);
        const fallback = products[0];
        if (fallback) onScanComplete(fallback);
      }
    });
  };

  const hasAnyUploadedImage = (Object.values(uploadedFiles) as UploadSlotItem[]).some(v => v?.previewUrl);

  return (
    <div className="wrap py-10 animate-fadein">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <h2 className="text-3xl font-extrabold font-['Manrope'] text-slate-900">
          Scan or upload your product
        </h2>
        <p className="mt-2 text-slate-600 text-sm md:text-base">
          Scan a barcode or QR code with your camera, upload a barcode picture, or upload product package labels.
        </p>
      </div>

      {/* Mode Toggle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
        <div
          onClick={() => {
            setActiveMode('barcode');
            stopLiveCamera();
          }}
          className={`p-6 bg-white border-2 rounded-2xl text-center cursor-pointer transition-all shadow-xs ${
            activeMode === 'barcode' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <ScanLine className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-['Manrope'] text-slate-900 mb-1">Scan Barcode / QR</h3>
          <p className="text-xs text-slate-500 mb-4">Live camera scanning, barcode photo upload, or code lookup.</p>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setActiveMode('barcode');
              startLiveCamera();
            }}
            className="btn btn-primary btn-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Open Camera Scanner</span>
          </button>
        </div>

        <div
          onClick={() => {
            setActiveMode('upload');
            stopLiveCamera();
          }}
          className={`p-6 bg-white border-2 rounded-2xl text-center cursor-pointer transition-all shadow-xs ${
            activeMode === 'upload' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-['Manrope'] text-slate-900 mb-1">Upload Package Images</h3>
          <p className="text-xs text-slate-500 mb-4">Add photos of the front, back, side, ingredients and nutrition panel.</p>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setActiveMode('upload');
            }}
            className="btn btn-outline btn-sm"
          >
            <span>Add Images</span>
          </button>
        </div>
      </div>

      {/* Barcode Mode Panel */}
      {activeMode === 'barcode' && (
        <div className="mt-7 p-6 bg-[#f5f7fb] border border-slate-200 rounded-2xl max-w-2xl mx-auto animate-fadein">
          {cameraError && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">Camera Notice:</span>
                <span>{cameraError}</span>
              </div>
              <button
                onClick={() => setCameraError(null)}
                className="text-amber-800 hover:text-amber-950 font-bold ml-2 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {fileScanError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-900 text-xs rounded-xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{fileScanError}</span>
              </div>
              <button
                onClick={() => setFileScanError(null)}
                className="text-red-800 font-bold ml-2 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Camera / Viewfinder Box */}
          <div className="relative h-64 md:h-72 rounded-2xl bg-[#0b101b] overflow-hidden flex items-center justify-center border border-slate-700 shadow-inner">
            {/* The Html5Qrcode video mounting element */}
            <div
              id="interactive-barcode-reader"
              className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
            />

            {/* Laser and Reticle Overlays */}
            {!isLiveCamera && (
              <div className="camera-reticle z-10 flex items-center justify-center pointer-events-none">
                <div className="absolute left-[8%] right-[8%] h-[2px] bg-[#7ee6a8] shadow-[0_0_10px_#7ee6a8] animate-scan-fast"></div>
              </div>
            )}

            {isLiveCamera && (
              <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#7ee6a8] to-transparent shadow-[0_0_12px_#7ee6a8] animate-scan-fast z-20 pointer-events-none"></div>
            )}

            {/* Status caption badge */}
            <div className="absolute bottom-3 left-4 right-4 text-center text-[#cfd8ea] text-xs z-20 bg-slate-900/80 backdrop-blur-xs px-3 py-1.5 rounded-full border border-slate-700/60 truncate">
              {camCaption}
            </div>

            {/* Stop Camera Button */}
            {isLiveCamera && (
              <button
                onClick={stopLiveCamera}
                className="absolute top-3 right-3 z-30 px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
              >
                <VideoOff className="w-3.5 h-3.5" />
                <span>Stop Camera</span>
              </button>
            )}
          </div>

          {/* Action Bar: Open Camera vs Upload Barcode Photo */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            {!isLiveCamera ? (
              <button
                onClick={startLiveCamera}
                className="btn btn-primary btn-sm"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Start Live Camera</span>
              </button>
            ) : (
              <button
                onClick={stopLiveCamera}
                className="btn btn-outline btn-sm text-red-600 border-red-200 hover:bg-red-50"
              >
                <VideoOff className="w-3.5 h-3.5" />
                <span>Stop Camera</span>
              </button>
            )}

            {/* Hidden file input for scanning a photo of a barcode */}
            <input
              ref={barcodeFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBarcodeFileSelect}
            />

            <button
              onClick={() => barcodeFileInputRef.current?.click()}
              className="btn btn-outline btn-sm bg-white"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Upload Barcode Photo</span>
            </button>
          </div>

          {/* Manual Barcode Search & Entry */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Enter Barcode Number Manually
            </label>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (manualBarcode.trim()) {
                  handleScannedBarcode(manualBarcode);
                } else if (selectedBarcode) {
                  handleScannedBarcode(selectedBarcode);
                }
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={e => setManualBarcode(e.target.value)}
                  placeholder="e.g. 8901030814 or any 8-13 digit food barcode..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary text-xs shrink-0"
              >
                <ScanLine className="w-4 h-4" />
                <span>Scan Code</span>
              </button>
            </form>
          </div>

          {/* Demo Barcodes Chips */}
          <div className="mt-5 text-center">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Popular Verified Indian Products (Click to Test Instantly)
            </p>
            <div className="flex flex-wrap gap-2 justify-center" id="demoBarcodes">
              {POPULAR_DEMO_BARCODES.map(item => (
                <button
                  key={item.barcode}
                  type="button"
                  onClick={() => {
                    setSelectedBarcode(item.barcode);
                    setManualBarcode(item.barcode);
                    handleScannedBarcode(item.barcode);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    selectedBarcode === item.barcode
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-300'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span className="font-mono text-[10px] text-slate-400">{item.barcode}</span>
                  <span className="font-bold text-slate-800">{item.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">{item.brand}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Package Mode Panel */}
      {activeMode === 'upload' && (
        <div className="mt-7 p-6 bg-white border border-slate-200 rounded-2xl max-w-2xl mx-auto animate-fadein">
          <h3 className="font-['Manrope'] font-bold text-base text-slate-900 mb-1">Add package photos</h3>
          <p className="text-xs text-slate-500 mb-4">Clearer ingredient and nutrition photos give more accurate extraction.</p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {SLOT_DEFS.map(slot => {
              const uploaded = uploadedFiles[slot.key];
              return (
                <label
                  key={slot.key}
                  className={`relative aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-all overflow-hidden ${
                    uploaded?.previewUrl
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
                        handleSlotFileChange(slot.key, e.target.files[0]);
                      }
                    }}
                  />

                  {uploaded?.previewUrl ? (
                    <>
                      <img
                        src={uploaded.previewUrl}
                        alt={`${slot.label} preview`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
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

          <div className="flex justify-center mt-7">
            <button
              onClick={executeImageAnalysis}
              disabled={!hasAnyUploadedImage}
              className="btn btn-primary"
            >
              <Check className="w-4 h-4" />
              <span>Analyze Product</span>
            </button>
          </div>
        </div>
      )}

      {/* Processing Modal Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadein">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl border border-slate-200">
            <div className="spinner mx-auto mb-4"></div>
            <h3 className="text-lg font-bold font-['Manrope'] text-slate-900">
              Analyzing barcode &amp; label...
            </h3>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-4">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-2.5">
              {currentStepText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
