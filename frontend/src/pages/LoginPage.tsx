import React, { useState } from 'react';
import { Droplets, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { login, quickLoginAs } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@sesame-erp.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role: string) => {
    setLoading(true);
    try {
      await quickLoginAs(role);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Header Banner */}
        <div className="p-8 text-center bg-gradient-to-b from-emerald-900 to-emerald-950 text-white relative">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-wide">
            SESAME FACTORY <span className="text-amber-400 font-extrabold">+ SUFALA</span>
          </h1>
          <p className="text-xs text-emerald-300 font-medium mt-1 uppercase tracking-wider">
            Integrated Enterprise ERP
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sesame-erp.com"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl font-medium focus:border-emerald-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl font-medium focus:border-emerald-600 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Personas */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              One-Click Persona Login (Testing)
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuick('owner')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              >
                <div className="font-bold text-slate-900">👑 Sanjay Hegde</div>
                <div className="text-[10px] text-purple-700 font-semibold">Owner / Super Admin</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuick('factory_mgr')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              >
                <div className="font-bold text-slate-900">🏭 Rajesh Sharma</div>
                <div className="text-[10px] text-blue-700 font-semibold">Factory Manager</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuick('sufala_blr')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              >
                <div className="font-bold text-slate-900">🏪 Suresh Gowda</div>
                <div className="text-[10px] text-amber-700 font-semibold">SUFALA BLR Mgr</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuick('b2b_mgr')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              >
                <div className="font-bold text-slate-900">💼 Vikram Patil</div>
                <div className="text-[10px] text-cyan-700 font-semibold">B2B Wholesale Mgr</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
