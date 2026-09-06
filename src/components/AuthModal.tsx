import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { X, Lock, Mail, User as UserIcon, Shield, CheckCircle2, Building2 } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, register, loginAsDemo } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'consumer' | 'seller' | 'officer'>('consumer');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isRegister) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemo = async (type: 'consumer' | 'seller' | 'officer') => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginAsDemo(type);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadein">
      <div className="relative w-full max-w-md p-6 bg-white border border-slate-200 rounded-2xl shadow-xl">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold font-['Manrope'] text-slate-900">
            {isRegister ? 'Create FoodLens Account' : 'Sign in to FoodLens'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Secure authentication for product scans, seller declarations & compliance reports
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <X className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Anand Sharma"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('consumer')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-colors ${
                    role === 'consumer' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  Consumer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-colors ${
                    role === 'seller' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  Seller / Brand
                </button>
                <button
                  type="button"
                  onClick={() => setRole('officer')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-colors ${
                    role === 'officer' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  FSSAI Officer
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 mt-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : isRegister ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-200">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2.5">
            Quick 1-Click Demo Login
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemo('consumer')}
              disabled={isSubmitting}
              className="p-2 border border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-left group"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 group-hover:text-indigo-600">
                <UserIcon className="w-3 h-3" />
                <span>Shopper</span>
              </div>
              <div className="text-[10px] text-slate-400">Priya S.</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemo('seller')}
              disabled={isSubmitting}
              className="p-2 border border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-left group"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 group-hover:text-indigo-600">
                <Building2 className="w-3 h-3" />
                <span>Seller</span>
              </div>
              <div className="text-[10px] text-slate-400">Anandmilan</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemo('officer')}
              disabled={isSubmitting}
              className="p-2 border border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-left group"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 group-hover:text-indigo-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Inspector</span>
              </div>
              <div className="text-[10px] text-slate-400">FSSAI Rajesh</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
