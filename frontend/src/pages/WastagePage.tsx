import React, { useEffect, useState } from 'react';
import { Trash2, Plus, CheckCircle, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { WastageRecord, Product } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const WastagePage: React.FC = () => {
  const { locations } = useAuth();
  const [wastageList, setWastageList] = useState<WastageRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWaste, setNewWaste] = useState({
    location_id: 1,
    product_id: 1,
    quantity: 10,
    wastage_type: 'CLEANING_LOSS',
    estimated_cost: 1500,
    reason: 'Dust and gravel screened out during raw seed sorting',
    disposal_method: 'Composted for organic fertilizer',
    is_recoverable: false,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [wList, pList] = await Promise.all([api.getWastage(), api.getProducts()]);
      setWastageList(wList);
      setProducts(pList);
    } catch (err) {
      console.error('Failed to load wastage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createWastage(newWaste);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error logging wastage: ${err.message}`);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.approveWastage(id);
      loadData();
    } catch (err: any) {
      alert(`Error approving wastage: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-rose-700" />
            Wastage & Operational Loss Management
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Audit processing residue, cleaning losses, oil spills, and supervisor approval workflow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Log Operational Wastage
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">Wastage Log & Stock Write-Offs</h2>
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
                <th className="py-3 px-4">Waste Slip #</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Loss Type</th>
                <th className="py-3 px-4">Item & Reason</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Est. Cost (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {wastageList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No wastage entries recorded. All processing operations optimal.
                  </td>
                </tr>
              ) : (
                wastageList.map((w) => {
                  const loc = locations.find((l) => l.id === w.location_id);
                  const prod = products.find((p) => p.id === w.product_id);
                  return (
                    <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{w.waste_number}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{loc?.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-rose-50 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                          {w.wastage_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{prod?.name || 'Item'}</div>
                        <div className="text-[10px] text-slate-400">{w.reason}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-700">
                        {Number(w.quantity)} {prod?.uom}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        ₹{Number(w.estimated_cost).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={w.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {w.status === 'PENDING' && (
                          <button
                            onClick={() => handleApprove(w.id)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700 shadow-2xs inline-flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve Write-off
                          </button>
                        )}
                        {w.status === 'APPROVED' && (
                          <span className="text-slate-400 text-[11px]">Approved</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Log Wastage */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Operational Wastage or Stock Discrepancy"
        subtitle="Requires manager sign-off before inventory ledger is written off"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Location</label>
              <select
                value={newWaste.location_id}
                onChange={(e) => setNewWaste({ ...newWaste, location_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Loss Type</label>
              <select
                value={newWaste.wastage_type}
                onChange={(e) => setNewWaste({ ...newWaste, wastage_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                <option value="CLEANING_LOSS">Cleaning Loss (Dirt/Hulls)</option>
                <option value="OIL_SPILL">Oil Spill</option>
                <option value="PROCESSING_RESIDUE">Processing Residue</option>
                <option value="DAMAGED_PRODUCT">Damaged / Broken Product</option>
                <option value="PACKAGING_LOSS">Packaging Loss (Bottles/Caps)</option>
                <option value="HANDLING_LOSS">Transit / Handling Loss</option>
                <option value="STOCK_DISCREPANCY">Audit Stock Discrepancy</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Affected Item</label>
              <select
                value={newWaste.product_id}
                onChange={(e) => setNewWaste({ ...newWaste, product_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.uom})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Quantity Lost</label>
              <input
                type="number"
                step="any"
                required
                value={newWaste.quantity}
                onChange={(e) => setNewWaste({ ...newWaste, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-rose-700"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Estimated Cost (₹)</label>
              <input
                type="number"
                step="any"
                value={newWaste.estimated_cost}
                onChange={(e) => setNewWaste({ ...newWaste, estimated_cost: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Disposal Method</label>
              <input
                type="text"
                value={newWaste.disposal_method}
                onChange={(e) => setNewWaste({ ...newWaste, disposal_method: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Detailed Reason</label>
            <input
              type="text"
              required
              value={newWaste.reason}
              onChange={(e) => setNewWaste({ ...newWaste, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700"
            >
              Submit for Manager Sign-off
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
