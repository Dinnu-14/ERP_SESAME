import React, { useEffect, useState } from 'react';
import { Settings, Building2, ShieldCheck, Database, Server, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Organization, Location } from '../types';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [oList, lList] = await Promise.all([api.getOrganizations(), api.getLocations()]);
      setOrgs(oList);
      setLocations(lList);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const org = orgs[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-700" />
            System Configuration & Organization Master
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Enterprise identity, multi-location configuration, and security settings
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Organization Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">{org?.name}</h2>
              <p className="font-mono text-xs text-slate-500">Corporate Identifier: {org?.code}</p>
            </div>
          </div>
          <span className="bg-emerald-50 text-emerald-800 font-bold text-xs px-3 py-1 rounded-full border border-emerald-200">
            Enterprise Edition
          </span>
        </div>
        <p className="text-xs text-slate-600 mb-4">{org?.description}</p>
      </div>

      {/* System Telemetry & Architecture Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <Server className="w-8 h-8 text-emerald-600 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Backend API Services</h4>
            <p className="text-xs text-emerald-700 font-semibold mt-0.5">FastAPI REST Live (:8000)</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Database Engine</h4>
            <p className="text-xs text-blue-700 font-semibold mt-0.5">PostgreSQL / SQLAlchemy 2.x</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-purple-600 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Active User Role</h4>
            <p className="text-xs text-purple-700 font-semibold mt-0.5">
              {user?.role?.replace(/_/g, ' ')} ({user?.full_name})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
