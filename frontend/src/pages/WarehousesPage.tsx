import React, { useEffect, useState } from 'react';
import {
  Warehouse,
  ArrowRightLeft,
  Plus,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  RefreshCw,
  Building2,
  Package,
} from 'lucide-react';
import { api } from '../services/api';
import { TransferOrder, Location, Product, Batch } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const WarehousesPage: React.FC = () => {
  const { locations, user } = useAuth();
  const [transfers, setTransfers] = useState<TransferOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferOrder | null>(null);

  // Form State
  const [newTransfer, setNewTransfer] = useState({
    source_location_id: 1,
    destination_location_id: 3, // SUFALA Bangalore
    product_id: 1,
    batch_id: 1,
    requested_quantity: 50,
    notes: 'Replenishment for SUFALA store retail sales',
  });

  const [dispatchData, setDispatchData] = useState({
    dispatched_quantity: 50,
    notes: 'Dispatched via logistics van KA-01-EA-9999',
  });

  const [receiveData, setReceiveData] = useState({
    received_quantity: 48,
    damaged_quantity: 2,
    notes: 'Unloaded and verified at branch counter',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [trfs, prods, bats] = await Promise.all([
        api.getTransfers(),
        api.getProducts(),
        api.getBatches(),
      ]);
      setTransfers(trfs);
      setProducts(prods);
      setBatches(bats);
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTransfer({
        source_location_id: newTransfer.source_location_id,
        destination_location_id: newTransfer.destination_location_id,
        notes: newTransfer.notes,
        items: [
          {
            product_id: newTransfer.product_id,
            batch_id: newTransfer.batch_id || undefined,
            requested_quantity: newTransfer.requested_quantity,
          },
        ],
      });
      setIsCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error creating transfer request: ${err.message}`);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.approveTransfer(id);
      loadData();
    } catch (err: any) {
      alert(`Error approving transfer: ${err.message}`);
    }
  };

  const handleOpenDispatch = (trf: TransferOrder) => {
    setSelectedTransfer(trf);
    const item = trf.items[0];
    setDispatchData({
      dispatched_quantity: Number(item?.requested_quantity || 0),
      notes: 'Dispatched via factory logistics van',
    });
    setIsDispatchModalOpen(true);
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransfer) return;
    try {
      const item = selectedTransfer.items[0];
      await api.dispatchTransfer(selectedTransfer.id, {
        items: [
          {
            item_id: item.id,
            batch_id: item.batch_id || undefined,
            dispatched_quantity: dispatchData.dispatched_quantity,
          },
        ],
        notes: dispatchData.notes,
      });
      setIsDispatchModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error dispatching goods: ${err.message}`);
    }
  };

  const handleOpenReceive = (trf: TransferOrder) => {
    setSelectedTransfer(trf);
    const item = trf.items[0];
    const dispQty = Number(item?.dispatched_quantity || 0);
    setReceiveData({
      received_quantity: dispQty,
      damaged_quantity: 0,
      notes: 'Good condition arrival',
    });
    setIsReceiveModalOpen(true);
  };

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransfer) return;
    try {
      const item = selectedTransfer.items[0];
      await api.receiveTransfer(selectedTransfer.id, {
        items: [
          {
            item_id: item.id,
            received_quantity: receiveData.received_quantity,
            damaged_quantity: receiveData.damaged_quantity,
            notes: receiveData.notes,
          },
        ],
        notes: receiveData.notes,
      });
      setIsReceiveModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error confirming receipt: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-emerald-700" />
            Store & Warehouse Management — Factory to SUFALA Pipeline
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage inter-warehouse dispatches, in-transit stock, receipt confirmations, and transit damages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Stock Transfer Request
          </button>
        </div>
      </div>

      {/* Warehouse Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {loc.code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    loc.location_type === 'FACTORY'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : loc.location_type === 'FRANCHISE_BRANCH'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {loc.location_type.replace(/_/g, ' ')}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm leading-snug">{loc.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{loc.city}, {loc.state}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Manager: <strong className="text-slate-800">{loc.manager_name || 'N/A'}</strong></span>
              <Building2 className="w-4 h-4 text-slate-300" />
            </div>
          </div>
        ))}
      </div>

      {/* 10-Step Workflow Banner */}
      <div className="bg-emerald-950 text-emerald-100 rounded-2xl p-4 border border-emerald-800 shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-emerald-400" />
          Standard Factory-to-SUFALA 10-Step Distribution Lifecycle
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px] font-medium text-emerald-200/90">
          <div className="bg-emerald-900/60 p-2 rounded-lg border border-emerald-800">
            1. Branch requests stock
          </div>
          <div className="bg-emerald-900/60 p-2 rounded-lg border border-emerald-800">
            2. Factory reviews & checks stock
          </div>
          <div className="bg-emerald-900/60 p-2 rounded-lg border border-emerald-800">
            3. Factory manager approves
          </div>
          <div className="bg-emerald-900/60 p-2 rounded-lg border border-emerald-800">
            4. Dispatched: Source stock drops
          </div>
          <div className="bg-emerald-900/60 p-2 rounded-lg border border-emerald-800">
            5. In-transit stock tracked
          </div>
        </div>
      </div>

      {/* Transfer Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">Active & Historical Transfer Orders</h2>
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
                <th className="py-3 px-4">Transfer Number</th>
                <th className="py-3 px-4">From Location</th>
                <th className="py-3 px-4">To Location</th>
                <th className="py-3 px-4">Requested Item</th>
                <th className="py-3 px-4">Req / Disp / Rec Qty</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No transfer orders created yet.
                  </td>
                </tr>
              ) : (
                transfers.map((trf) => {
                  const source = locations.find((l) => l.id === trf.source_location_id);
                  const dest = locations.find((l) => l.id === trf.destination_location_id);
                  const item = trf.items[0];
                  const prod = item?.product;

                  return (
                    <tr key={trf.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {trf.transfer_number}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {source?.name || `Loc ${trf.source_location_id}`}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-800">
                        {dest?.name || `Loc ${trf.destination_location_id}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{prod?.name || 'Assorted Items'}</div>
                        <div className="text-[10px] text-slate-400">{prod?.sku}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">
                          {Number(item?.requested_quantity || 0)}
                        </span>{' '}
                        /{' '}
                        <span className="font-bold text-blue-700">
                          {Number(item?.dispatched_quantity || 0)}
                        </span>{' '}
                        /{' '}
                        <span className="font-bold text-emerald-700">
                          {Number(item?.received_quantity || 0)}
                        </span>
                        {Number(item?.damaged_quantity || 0) > 0 && (
                          <span className="ml-1 text-[10px] text-rose-600 font-bold">
                            ({item.damaged_quantity} dmg)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={trf.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        {trf.status === 'REQUESTED' && (
                          <button
                            onClick={() => handleApprove(trf.id)}
                            className="px-2.5 py-1 bg-amber-500 text-white rounded-lg font-bold text-[11px] hover:bg-amber-600 shadow-2xs"
                          >
                            Approve
                          </button>
                        )}
                        {(trf.status === 'APPROVED' || trf.status === 'REQUESTED') && (
                          <button
                            onClick={() => handleOpenDispatch(trf)}
                            className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold text-[11px] hover:bg-blue-700 shadow-2xs inline-flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Dispatch
                          </button>
                        )}
                        {trf.status === 'DISPATCHED' && (
                          <button
                            onClick={() => handleOpenReceive(trf)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700 shadow-2xs inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Confirm Receipt
                          </button>
                        )}
                        {trf.status === 'COMPLETED' && (
                          <span className="text-[11px] text-slate-400 font-medium">Reconciled</span>
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

      {/* Modal: Create Transfer Request */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Initiate Stock Transfer Request"
        subtitle="Request bulk seeds or finished bottles from central factory to SUFALA branch"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Source Location (From)</label>
              <select
                value={newTransfer.source_location_id}
                onChange={(e) =>
                  setNewTransfer({ ...newTransfer, source_location_id: Number(e.target.value) })
                }
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
              <label className="block font-bold text-slate-700 mb-1">Destination Branch (To)</label>
              <select
                value={newTransfer.destination_location_id}
                onChange={(e) =>
                  setNewTransfer({ ...newTransfer, destination_location_id: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Product</label>
              <select
                value={newTransfer.product_id}
                onChange={(e) =>
                  setNewTransfer({ ...newTransfer, product_id: Number(e.target.value) })
                }
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
              <label className="block font-bold text-slate-700 mb-1">Requested Quantity</label>
              <input
                type="number"
                step="any"
                required
                value={newTransfer.requested_quantity}
                onChange={(e) =>
                  setNewTransfer({ ...newTransfer, requested_quantity: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Transfer Purpose / Notes</label>
            <input
              type="text"
              value={newTransfer.notes}
              onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              Submit Transfer Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Dispatch Transfer */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title="Dispatch Goods from Source Location"
        subtitle={`Transfer: ${selectedTransfer?.transfer_number} -> Deducts inventory immediately from source location`}
      >
        <form onSubmit={handleDispatch} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Quantity to Dispatch</label>
            <input
              type="number"
              step="any"
              required
              value={dispatchData.dispatched_quantity}
              onChange={(e) =>
                setDispatchData({ ...dispatchData, dispatched_quantity: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-sm"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Dispatch Dispatcher / Vehicle / Waybill Note
            </label>
            <input
              type="text"
              required
              value={dispatchData.notes}
              onChange={(e) => setDispatchData({ ...dispatchData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsDispatchModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
            >
              Confirm Dispatch & Reduce Source Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Receipt */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="Confirm Inward Receipt at Destination"
        subtitle={`Transfer: ${selectedTransfer?.transfer_number} -> Credits good stock to branch, logs damaged units to Wastage`}
      >
        <form onSubmit={handleReceive} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Good Quantity Received (Added to Shelf)
              </label>
              <input
                type="number"
                step="any"
                required
                value={receiveData.received_quantity}
                onChange={(e) =>
                  setReceiveData({ ...receiveData, received_quantity: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-emerald-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Damaged / Broken in Transit
              </label>
              <input
                type="number"
                step="any"
                value={receiveData.damaged_quantity}
                onChange={(e) =>
                  setReceiveData({ ...receiveData, damaged_quantity: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-rose-700"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Inspection Notes on Arrival</label>
            <input
              type="text"
              value={receiveData.notes}
              onChange={(e) => setReceiveData({ ...receiveData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsReceiveModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              Accept Goods & Increase Destination Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
