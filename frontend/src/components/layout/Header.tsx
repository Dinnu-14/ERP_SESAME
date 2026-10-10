import React, { useState } from 'react';
import {
  Bell,
  Search,
  Building2,
  UserCheck,
  LogOut,
  Sparkles,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, locations, currentLocationId, setCurrentLocationId, quickLoginAs, logout } = useAuth();
  const navigate = useNavigate();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 px-6 flex items-center justify-between shadow-xs">
      {/* Left: Location Filter & Search */}
      <div className="flex items-center gap-4">
        {/* Active Branch Switcher */}
        <div className="flex items-center gap-2 bg-slate-100/90 hover:bg-slate-200/80 transition-colors px-3 py-1.5 rounded-xl border border-slate-200">
          <Building2 className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-semibold text-slate-600">Location:</span>
          <select
            value={currentLocationId}
            onChange={(e) =>
              setCurrentLocationId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
            }
            className="bg-transparent text-xs font-bold text-slate-900 border-none outline-none cursor-pointer pr-2"
          >
            <option value="ALL">🌐 All Locations (Consolidated View)</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.location_type.replace(/_/g, ' ')})
              </option>
            ))}
          </select>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl w-64 text-slate-400 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
          <Search className="w-4 h-4" />
          <input
            type="text"
            placeholder="Search batches, SKUs, invoices..."
            className="bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none w-full"
          />
        </div>
      </div>

      {/* Right: Quick Switcher, Notifications & User Menu */}
      <div className="flex items-center gap-3">
        {/* Role Exploration Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors shadow-2xs"
            title="Switch demo persona for testing permissions"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Persona Switcher</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
          </button>

          {showRoleMenu && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
              onMouseLeave={() => setShowRoleMenu(false)}
            >
              <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Role Persona
              </div>
              <button
                onClick={() => { quickLoginAs('owner'); setShowRoleMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between"
              >
                <span className="font-semibold text-slate-800">👑 Sanjay Hegde</span>
                <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">Owner / Admin</span>
              </button>
              <button
                onClick={() => { quickLoginAs('factory_mgr'); setShowRoleMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between"
              >
                <span className="font-semibold text-slate-800">🏭 Rajesh Sharma</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">Factory Mgr</span>
              </button>
              <button
                onClick={() => { quickLoginAs('sufala_blr'); setShowRoleMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between"
              >
                <span className="font-semibold text-slate-800">🏪 Suresh Gowda</span>
                <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">SUFALA BLR Mgr</span>
              </button>
              <button
                onClick={() => { quickLoginAs('quality_mgr'); setShowRoleMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between"
              >
                <span className="font-semibold text-slate-800">🔬 Dr. Sneha Varma</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Quality Mgr</span>
              </button>
              <button
                onClick={() => { quickLoginAs('b2b_mgr'); setShowRoleMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between"
              >
                <span className="font-semibold text-slate-800">💼 Vikram Patil</span>
                <span className="text-[10px] bg-cyan-100 text-cyan-700 font-bold px-1.5 py-0.5 rounded">B2B Sales</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
        </button>

        {/* User Card & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">{user?.full_name}</p>
            <p className="text-[10px] text-slate-500 font-medium">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
