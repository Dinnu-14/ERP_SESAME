import React, { useEffect, useState } from 'react';
import { Sprout, RefreshCw, Beaker, CheckCircle2, ShieldCheck, Scale, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Product, Batch, StockBalance } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const RawMaterialPage: React.FC = () => {
  const { locations } = useAuth();
  const [seedProducts, setSeedProducts] = useState<Product[]>([]);
  const [seedBatches, setSeedBatches] = useState<Batch[]>([]);
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, bats, bals] = await Promise.all([
        api.getProducts({ product_type: 'RAW_MATERIAL' }),
        api.getBatches(),
        api.getBalances(),
      ]);
      setSeedProducts(prods);
      setSeedBatches(bats.filter((b) => prods.some((p) => p.id === b.product_id)));
      setBalances(bals.filter((b) => prods.some((p) => p.id === b.product_id)));
    } catch (err) {
      console.error('Failed to load raw materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRawStock = balances.reduce((sum, b) => sum + Number(b.quantity), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sprout className="w-6 h-6 text-amber-600" />
            Raw Material & Sesame Seed Management
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Seed lot traceability, moisture grading (ideal 5.5% - 6.5%), cleaning stage, and store silos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-700" />
            Total Raw Stock: {totalRawStock.toLocaleString()} KG
          </div>
          <button
            onClick={loadData}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Raw Seed Lots Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">Active Sesame Seed Lots in Silos & Warehouses</h2>
          <span className="text-xs text-slate-500">{seedBatches.length} Active Batches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Seed Batch #</th>
                <th className="py-3 px-4">Variety / Grade</th>
                <th className="py-3 px-4">Storage Location</th>
                <th className="py-3 px-4">Available Qty</th>
                <th className="py-3 px-4">Moisture Standard</th>
                <th className="py-3 px-4">Quality Status</th>
                <th className="py-3 px-4">Cost Basis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {seedBatches.map((b) => {
                const prod = seedProducts.find((p) => p.id === b.product_id);
                const loc = locations.find((l) => l.id === b.location_id);
                return (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {b.batch_number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {prod?.name}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {loc?.name || 'Central Silo'}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-amber-800 text-sm">
                      {Number(b.current_quantity).toLocaleString()} KG
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="font-semibold text-emerald-700">6.0% (Optimal)</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Inspected & Passed
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{b.cost_per_unit} / KG
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
