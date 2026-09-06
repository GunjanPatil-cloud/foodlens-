import React, { useState } from 'react';
import { PageId } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { User, LogOut, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentPage: PageId;
  onNavigate: (page: PageId, opts?: { scanTab?: 'barcode' | 'upload' }) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const { user, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNav = (page: PageId, opts?: { scanTab?: 'barcode' | 'upload' }) => {
    onNavigate(page, opts);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="wrap flex items-center justify-between h-[68px]">
        {/* Logo */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 font-['Manrope'] font-extrabold text-xl text-slate-900 bg-transparent border-0 p-0 hover:opacity-90 transition-opacity"
          aria-label="FoodLens home"
        >
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3" />
              <path d="M9 9h6v6H9z" />
            </svg>
          </span>
          <span>FoodLens</span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5" id="primaryNav">
          <button
            onClick={() => handleNav('home')}
            className={`px-3.5 py-2 rounded-full text-[14.5px] font-semibold transition-colors ${
              currentPage === 'home' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('scanner')}
            className={`px-3.5 py-2 rounded-full text-[14.5px] font-semibold transition-colors ${
              currentPage === 'scanner' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Scan Product
          </button>
          <button
            onClick={() => handleNav('compare')}
            className={`px-3.5 py-2 rounded-full text-[14.5px] font-semibold transition-colors ${
              currentPage === 'compare' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Compare
          </button>
          <button
            onClick={() => handleNav('reviews')}
            className={`px-3.5 py-2 rounded-full text-[14.5px] font-semibold transition-colors ${
              currentPage === 'reviews' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Reviews
          </button>
          <button
            onClick={() => handleNav('about')}
            className={`px-3.5 py-2 rounded-full text-[14.5px] font-semibold transition-colors ${
              currentPage === 'about' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            About
          </button>
          <button
            onClick={() => handleNav('seller')}
            className={`ml-2 px-4 py-1.5 border border-slate-900 rounded-full text-[13.5px] font-semibold transition-all ${
              currentPage === 'seller' ? 'bg-slate-900 text-white' : 'text-slate-900 hover:bg-slate-100'
            }`}
          >
            For Sellers
          </button>

          {/* User Profile / Auth Button */}
          <div className="relative ml-3">
            {user ? (
              <div>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full text-xs font-semibold text-slate-800 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs uppercase font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-fadein">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                      <div className="text-[11px] text-slate-500 capitalize flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{user.role} role</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNav('seller')}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Pre-listing tool</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold"
            >
              {user.name.charAt(0)}
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-2.5 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-full"
            >
              Sign In
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg text-slate-700"
            aria-label="Toggle menu"
          >
            <span className="text-xl">☰</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1.5 shadow-md animate-fadein">
          <button
            onClick={() => handleNav('home')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
              currentPage === 'home' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('scanner')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
              currentPage === 'scanner' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'
            }`}
          >
            Scan Product
          </button>
          <button
            onClick={() => handleNav('compare')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
              currentPage === 'compare' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'
            }`}
          >
            Compare Alternatives
          </button>
          <button
            onClick={() => handleNav('reviews')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
              currentPage === 'reviews' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'
            }`}
          >
            Customer Reviews
          </button>
          <button
            onClick={() => handleNav('about')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
              currentPage === 'about' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'
            }`}
          >
            About FoodLens
          </button>
          <button
            onClick={() => handleNav('seller')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
              currentPage === 'seller' ? 'bg-slate-900 text-white' : 'text-slate-900 bg-slate-50'
            }`}
          >
            For Sellers &amp; Pre-Listing
          </button>
          {user && (
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600"
            >
              Sign Out ({user.name})
            </button>
          )}
        </div>
      )}
    </header>
  );
};
