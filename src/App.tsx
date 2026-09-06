import React, { useState, useEffect, useCallback } from 'react';
import { PageId, Product, Manufacturer, StatsData } from './types.js';
import { api } from './services/api.js';
import { AuthProvider } from './context/AuthContext.js';
import { Header } from './components/Header.js';
import { AuthModal } from './components/AuthModal.js';
import { HomePage } from './components/HomePage.js';
import { ScannerPage } from './components/ScannerPage.js';
import { ResultPage } from './components/ResultPage.js';
import { ComparePage } from './components/ComparePage.js';
import { ReviewsPage } from './components/ReviewsPage.js';
import { ManufacturerPage } from './components/ManufacturerPage.js';
import { AboutPage } from './components/AboutPage.js';
import { SellerPage } from './components/SellerPage.js';
import { Check } from 'lucide-react';

export function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [scannerTab, setScannerTab] = useState<'barcode' | 'upload'>('barcode');
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Fetch initial data from backend
  const loadData = useCallback(async () => {
    try {
      const [prods, manus, statData] = await Promise.all([
        api.getProducts(),
        api.getManufacturers(),
        api.getStats()
      ]);
      setProducts(prods);
      setManufacturers(manus);
      setStats(statData);
      if (prods.length > 0 && !currentProduct) {
        setCurrentProduct(prods[0]);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, [currentProduct]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time updates subscription via SSE
  useEffect(() => {
    const unsubscribe = api.subscribeToUpdates((event, payload) => {
      if (event === 'product:added') {
        const newP = payload as Product;
        setProducts(prev => [newP, ...prev.filter(p => p.id !== newP.id)]);
        showToast(`Real-time update: ${newP.name} added to catalog`);
        api.getStats().then(setStats).catch(() => {});
      } else if (event === 'product:updated') {
        const updated = payload as Product;
        setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
        if (currentProduct?.id === updated.id) {
          setCurrentProduct(updated);
        }
      } else if (event === 'review:added') {
        showToast('Real-time update: New customer review recorded');
        api.getStats().then(setStats).catch(() => {});
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentProduct, showToast]);

  const handleNavigate = (page: PageId, opts?: { scanTab?: 'barcode' | 'upload' }) => {
    if (opts?.scanTab) {
      setScannerTab(opts.scanTab);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScanComplete = (product: Product) => {
    setCurrentProduct(product);
    // Ensure product is in list
    setProducts(prev => {
      if (!prev.some(p => p.id === product.id)) {
        return [product, ...prev];
      }
      return prev;
    });
    handleNavigate('result');
    showToast(`Inspection complete for ${product.name}`);
  };

  const handleSelectProduct = (product: Product) => {
    setCurrentProduct(product);
    handleNavigate('result');
  };

  const currentManufacturer = manufacturers.find(
    m => m.id === currentProduct?.manufacturerId
  ) || manufacturers[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-['Inter']">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage stats={stats} onNavigate={handleNavigate} />
        )}

        {currentPage === 'scanner' && (
          <ScannerPage
            products={products}
            initialTab={scannerTab}
            onScanComplete={handleScanComplete}
          />
        )}

        {currentPage === 'result' && currentProduct && (
          <ResultPage
            product={currentProduct}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'compare' && (
          <ComparePage
            products={products}
            currentProductId={currentProduct?.id || 'p1'}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentPage === 'reviews' && currentProduct && (
          <ReviewsPage
            product={currentProduct}
            onReviewAdded={newRev => {
              showToast('Review submitted successfully');
              api.getProducts().then(setProducts).catch(() => {});
            }}
          />
        )}

        {currentPage === 'manufacturer' && (
          <ManufacturerPage
            manufacturer={currentManufacturer}
            products={products}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentPage === 'seller' && (
          <SellerPage
            onProductCreated={newProd => {
              setCurrentProduct(newProd);
              setProducts(prev => [newProd, ...prev]);
              showToast(`Product ${newProd.name} registered into database`);
            }}
          />
        )}

        {currentPage === 'about' && <AboutPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 mt-12 bg-white">
        <div className="wrap flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 text-center sm:text-left">
          <span>
            © 2026 FoodLens — Automated packaged food label transparency &amp; Legal Metrology screening.
          </span>
          <span className="font-semibold text-slate-700">
            Built for the Smart India Hackathon (Team Zenith)
          </span>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-full shadow-lg animate-fadein">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
