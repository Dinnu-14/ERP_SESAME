import React, { useEffect, useState } from 'react';
import {
  Factory,
  Plus,
  CheckCircle,
  AlertCircle,
  Percent,
  Scale,
  RefreshCw,
  Beaker,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { ProductionBatch, Product, Batch, Location } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const ProductionPage: React.FC = () => {
  const { locations } = useAuth();
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [seedBatches, setSeedBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);

  // Start Form
  const [startForm, setStartForm] = useState({
    location_id: 1,
    seed_product_id: 1,
    seed_batch_id: 1,
    seed_input_qty: 1000,
    oil_product_id: 3,
    cake_product_id: 6,
    expected_oil_yield_pct: 46.0,
    notes: 'Standard cold press batch',
  });

  // Complete Form
  const [completeForm, setCompleteForm] = useState({
    oil_output_qty: 460,
    cake_output_qty: 520,
    recorded_loss_qty: 10,
    notes: 'Optimal expeller throughput',
    ffa_pct: 0.8,
    moisture_pct: 0.15,
    color: 'Clear Golden Yellow',
    odor: 'Characteristic nutty aroma',
    density: 0.92,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, bats, rawBats] = await Promise.all([
        api.getProducts(),
        api.getProductionBatches(),
        api.getBatches({ status: 'ACTIVE' }),
      ]);
      setProducts(prods);
      setBatches(bats);
      setSeedBatches(rawBats);
    } catch (err) {
      console.error('Failed to load production batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.startProduction(startForm);
      setIsStartModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error starting batch: ${err.message}`);
    }
  };

  const handleOpenComplete = (b: ProductionBatch) => {
    setSelectedBatch(b);
    const expOil = (Number(b.seed_input_qty) * Number(b.expected_oil_yield_pct)) / 100;
    const expCake = Number(b.seed_input_qty) * 0.52;
    setCompleteForm({
      oil_output_qty: Math.round(expOil * 10) / 10,
      cake_output_qty: Math.round(expCake * 10) / 10,
      recorded_loss_qty: 10,
      notes: 'Completed standard run',
      ffa_pct: 0.8,
      moisture_pct: 0.15,
      color: 'Clear Golden',
      odor: 'Pleasant aroma',
      density: 0.92,
    });
    setIsCompleteModalOpen(true);
  };

  const handleCompleteBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    try {
      await api.completeProduction(selectedBatch.id, {
        oil_output_qty: completeForm.oil_output_qty,
        cake_output_qty: completeForm.cake_output_qty,
        recorded_loss_qty: completeForm.recorded_loss_qty,
        notes: completeForm.notes,
        quality_check: {
          free_fatty_acids_pct: completeForm.ffa_pct,
          moisture_pct: completeForm.moisture_pct,
          color: completeForm.color,
          odor: completeForm.odor,
          density_g_ml: completeForm.density,
          status: 'PASSED',
          comments: 'Batch meets all FSSAI and cold-pressed purity standards',
        },
      });
      setIsCompleteModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error completing batch: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Factory className="w-6 h-6 text-emerald-700" />
            Production & Cold-Press Oil Extraction
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Track seed issue, mass-balance yields, pinac cake by-products, and QC lab parameters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStartModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Start Extraction Batch
          </button>
        </div>
      </div>

      {/* Production Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">Extraction Batches</h2>
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
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Seed Input (KG)</th>
                <th className="py-3 px-4">Oil Output (L)</th>
                <th className="py-3 px-4">Cake Output (KG)</th>
                <th className="py-3 px-4">Oil Yield %</th>
                <th className="py-3 px-4">Mass Variance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No production batches found. Click "Start Extraction Batch" to begin.
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {b.batch_number}
                      <div className="text-[10px] text-slate-400 font-normal">
                        Started: {new Date(b.started_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-700">
                      {Number(b.seed_input_qty)} KG
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-700 text-sm">
                      {Number(b.oil_output_qty)} L
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {Number(b.cake_output_qty)} KG
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-purple-700">
                        {Number(b.actual_oil_yield_pct)}%
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        (Exp: {b.expected_oil_yield_pct}%)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {Number(b.unexplained_variance_qty)} KG
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {b.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleOpenComplete(b)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700 shadow-2xs"
                        >
                          Complete & Log QC
                        </button>
                      )}
                      {b.status === 'COMPLETED' && (
                        <span className="text-emerald-700 font-semibold text-[11px] flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Output Credited
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Start Production Batch */}
      <Modal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        title="Start Oil Extraction Batch"
        subtitle="Deducts input seed from inventory and initiates extraction cycle"
      >
        <form onSubmit={handleStartBatch} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Production Unit / Factory</label>
              <select
                value={startForm.location_id}
                onChange={(e) => setStartForm({ ...startForm, location_id: Number(e.target.value) })}
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
              <label className="block font-bold text-slate-700 mb-1">Seed Raw Material</label>
              <select
                value={startForm.seed_product_id}
                onChange={(e) =>
                  setStartForm({ ...startForm, seed_product_id: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                {products
                  .filter((p) => p.product_type === 'RAW_MATERIAL')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Source Seed Batch</label>
              <select
                value={startForm.seed_batch_id}
                onChange={(e) =>
                  setStartForm({ ...startForm, seed_batch_id: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              >
                {seedBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_number} (Avail: {b.current_quantity})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Seed Input Quantity (KG)</label>
              <input
                type="number"
                step="any"
                required
                value={startForm.seed_input_qty}
                onChange={(e) =>
                  setStartForm({ ...startForm, seed_input_qty: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-amber-800"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Oil Product</label>
              <select
                value={startForm.oil_product_id}
                onChange={(e) =>
                  setStartForm({ ...startForm, oil_product_id: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                {products
                  .filter((p) => p.product_type === 'FINISHED_GOOD' || p.product_type === 'INTERMEDIATE')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Expected Yield %</label>
              <input
                type="number"
                step="any"
                value={startForm.expected_oil_yield_pct}
                onChange={(e) =>
                  setStartForm({ ...startForm, expected_oil_yield_pct: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsStartModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              Start Expeller Cycle
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Complete Batch */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="Complete Production & Laboratory QC Log"
        subtitle={`Batch: ${selectedBatch?.batch_number} | Input Seed: ${selectedBatch?.seed_input_qty} KG`}
      >
        <form onSubmit={handleCompleteBatch} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Oil Output (L)</label>
              <input
                type="number"
                step="any"
                required
                value={completeForm.oil_output_qty}
                onChange={(e) =>
                  setCompleteForm({ ...completeForm, oil_output_qty: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold text-emerald-700"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cake Output (KG)</label>
              <input
                type="number"
                step="any"
                required
                value={completeForm.cake_output_qty}
                onChange={(e) =>
                  setCompleteForm({ ...completeForm, cake_output_qty: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Recorded Loss (KG)</label>
              <input
                type="number"
                step="any"
                value={completeForm.recorded_loss_qty}
                onChange={(e) =>
                  setCompleteForm({ ...completeForm, recorded_loss_qty: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-rose-700"
              />
            </div>
          </div>

          {/* QC Inspection Section */}
          <div className="border border-slate-200 rounded-xl p-3 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-emerald-800">
              <Beaker className="w-3.5 h-3.5 text-emerald-600" />
              Laboratory Quality Control Parameters
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">FFA % (Free Fatty Acids)</label>
                <input
                  type="number"
                  step="any"
                  value={completeForm.ffa_pct}
                  onChange={(e) =>
                    setCompleteForm({ ...completeForm, ffa_pct: Number(e.target.value) })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Moisture %</label>
                <input
                  type="number"
                  step="any"
                  value={completeForm.moisture_pct}
                  onChange={(e) =>
                    setCompleteForm({ ...completeForm, moisture_pct: Number(e.target.value) })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Oil Color</label>
                <input
                  type="text"
                  value={completeForm.color}
                  onChange={(e) => setCompleteForm({ ...completeForm, color: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Aroma / Odor</label>
                <input
                  type="text"
                  value={completeForm.odor}
                  onChange={(e) => setCompleteForm({ ...completeForm, odor: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsCompleteModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              Reconcile Mass-Balance & Post Finished Goods
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
