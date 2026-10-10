import React, { useEffect, useState } from 'react';
import {
  Sprout,
  Droplets,
  Percent,
  IndianRupee,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { api } from '../services/api';
import { DashboardData } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboardData();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading integrated ERP telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-800">
        <p className="font-bold">Error loading dashboard</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-3 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { kpis } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Central ERP Telemetry & Owner Command Center
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time synchronized overview across Central Sesame Plant, Warehouses, and SUFALA Branches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Refresh
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Database Sync
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title={kpis.raw_seeds.title}
          value={kpis.raw_seeds.value}
          subtext={kpis.raw_seeds.subtext}
          changePct={kpis.raw_seeds.change_pct}
          icon={Sprout}
          variant="amber"
        />
        <StatCard
          title={kpis.finished_oil.title}
          value={kpis.finished_oil.value}
          subtext={kpis.finished_oil.subtext}
          changePct={kpis.finished_oil.change_pct}
          icon={Droplets}
          variant="emerald"
        />
        <StatCard
          title={kpis.oil_yield.title}
          value={kpis.oil_yield.value}
          subtext={kpis.oil_yield.subtext}
          changePct={kpis.oil_yield.change_pct}
          icon={Percent}
          variant="purple"
        />
        <StatCard
          title={kpis.total_revenue.title}
          value={kpis.total_revenue.value}
          subtext={kpis.total_revenue.subtext}
          changePct={kpis.total_revenue.change_pct}
          icon={IndianRupee}
          variant="blue"
        />
        <StatCard
          title={kpis.in_transit.title}
          value={kpis.in_transit.value}
          subtext={kpis.in_transit.subtext}
          icon={Truck}
          variant="slate"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production & Extraction Performance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Oil Extraction Yield & By-Products</h2>
              <p className="text-xs text-slate-500">Seed Input (KG) vs Oil Output (L) vs Cake (KG)</p>
            </div>
            <Link
              to="/production"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Batch Logs <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.production_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="seed_consumed_kg" name="Input Seed (KG)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="oil_produced_l" name="Extracted Oil (L)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cake_produced_kg" name="Oil Cake (KG)" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Trend (Retail vs B2B) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue Trajectory (Retail vs B2B Wholesale)</h2>
              <p className="text-xs text-slate-500">Daily revenue comparison in INR (₹)</p>
            </div>
            <Link
              to="/reports"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Financial Statements <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.sales_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="retail_sales"
                  name="SUFALA Retail POS (₹)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="b2b_sales"
                  name="B2B Wholesale Invoices (₹)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Location Stock Matrix & Operational Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Inventory Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">Branch & Warehouse Stock Summary</h2>
            </div>
            <Link
              to="/transfers"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Transfer Goods <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">SKU Count</th>
                  <th className="py-2.5 px-3">Stock Units</th>
                  <th className="py-2.5 px-3 text-right">Valuation (Est.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data.branch_stocks.map((b) => (
                  <tr key={b.location_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800">{b.location_name}</td>
                    <td className="py-3 px-3">
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                        {b.location_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{b.total_items_count} items</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {b.total_stock_units.toLocaleString()} Units
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-emerald-700">
                      ₹{b.total_valuation.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Watchlist / Low Stock */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Low-Stock & Reorder Alerts</h2>
            </div>
            {data.low_stock_alerts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No items below reorder threshold. All inventory healthy!
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.low_stock_alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{alert.product_name}</p>
                      <p className="text-[10px] text-slate-500">{alert.location_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-amber-700">
                        {alert.current_stock} {alert.uom}
                      </p>
                      <p className="text-[10px] text-slate-400">Min: {alert.reorder_level}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <p className="text-[10px] font-semibold text-slate-500 uppercase">SOP Compliance</p>
              <p className="text-lg font-bold text-emerald-700">{data.sop_compliance_pct}%</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <p className="text-[10px] font-semibold text-slate-500 uppercase">Staff Attendance</p>
              <p className="text-lg font-bold text-blue-700">{data.attendance_rate_pct}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
