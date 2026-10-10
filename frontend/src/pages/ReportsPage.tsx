import React, { useEffect, useState } from 'react';
import {
  PieChart as PieIcon,
  DollarSign,
  TrendingUp,
  Download,
  Building2,
  Receipt,
  Scale,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardData } from '../types';
import { StatCard } from '../components/common/StatCard';

export const ReportsPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardData();
      setData(res);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalValuation = data?.branch_stocks.reduce((acc, b) => acc + b.total_valuation, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <PieIcon className="w-6 h-6 text-emerald-700" />
            Financial Intelligence & Operational Margins
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Operational reporting reconciling purchase outlays, production conversions, and branch sales margins
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Exporting consolidated financial report to CSV/Excel format...')}
            className="px-3.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export Statement
          </button>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Total Network Valuation</span>
          <p className="text-2xl font-black text-slate-900 mt-2">₹{totalValuation.toLocaleString()}</p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">Based on on-hand batch cost rates</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Gross Realized Revenue</span>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            {data?.kpis.total_revenue.value || '₹0'}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">Combined POS + B2B invoices</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Estimated Extraction Yield Margin</span>
          <p className="text-2xl font-black text-purple-700 mt-2">
            {data?.kpis.oil_yield.value || '46.0%'}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">Target benchmark: 45.0%</p>
        </div>
      </div>

      {/* Branch Financial Comparison */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">Branch Performance & Stock Valuation Matrix</h2>
          <button
            onClick={loadData}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Operational Type</th>
                <th className="py-3 px-4">SKUs Stocked</th>
                <th className="py-3 px-4">Total Physical Units</th>
                <th className="py-3 px-4 text-right">Inventory Valuation (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data?.branch_stocks.map((b) => (
                <tr key={b.location_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{b.location_name}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                      {b.location_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{b.total_items_count} SKUs</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {b.total_stock_units.toLocaleString()} Units
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-emerald-800 text-sm">
                    ₹{b.total_valuation.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accounting Scope Disclaimer Alert */}
      <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1">
        <p className="font-bold text-slate-800">Operational Reporting Architecture Note:</p>
        <p>
          This ERP module provides operational inventory accounting, yield mass-balance reconciliation,
          and sales invoice registers. All valuation figures derive directly from active inventory batches,
          goods receipts, and confirmed sales transactions.
        </p>
      </div>
    </div>
  );
};
