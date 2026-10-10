import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Warehouse,
  Sprout,
  ShoppingBag,
  Factory,
  Trash2,
  Store,
  Briefcase,
  Users,
  FileCheck2,
  PieChart,
  Bell,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Droplets,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Inventory Management', path: '/inventory', icon: Boxes },
    { label: 'Store & Warehouses', path: '/transfers', icon: Warehouse },
    { label: 'Raw Material', path: '/raw-materials', icon: Sprout },
    { label: 'Procurement', path: '/procurement', icon: ShoppingBag },
    { label: 'Oil Extraction & Prod.', path: '/production', icon: Factory },
    { label: 'Wastage Management', path: '/wastage', icon: Trash2 },
    { label: 'SUFALA Franchise', path: '/franchise', icon: Store },
    { label: 'B2B Wholesale', path: '/b2b', icon: Briefcase },
    { label: 'Employee Management', path: '/employees', icon: Users },
    { label: 'SOP Procedures', path: '/sops', icon: FileCheck2 },
    { label: 'Finance & Reports', path: '/reports', icon: PieChart },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Audit Logs', path: '/audit-logs', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800 shadow-xl ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/40">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-900/50">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wide text-white flex items-center gap-1.5">
                SESAME <span className="text-amber-400 font-black">+ SUFALA</span>
              </div>
              <p className="text-[10px] text-emerald-400/90 font-medium uppercase tracking-wider">
                Integrated ERP
              </p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-900/50">
            <Droplets className="w-5 h-5" />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
            isCollapsed ? 'hidden' : 'block'
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              } ${isCollapsed ? 'justify-center px-0' : ''}`
            }
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom User Indicator & Toggle */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30">
        {isCollapsed ? (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full py-2 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/30">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-[10px] text-emerald-400 font-medium truncate uppercase">
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
