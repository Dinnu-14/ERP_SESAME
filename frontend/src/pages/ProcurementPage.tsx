import React, { useEffect, useState } from 'react';
import { ShoppingBag, Plus, RefreshCw, FileText, CheckCircle, Truck, Users } from 'lucide-react';
import { api } from '../services/api';
import { Supplier, PurchaseOrder, GoodsReceipt, Product } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';

export const ProcurementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'grn' | 'suppliers'>('orders');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Form states
  const [newPO, setNewPO] = useState({
    supplier_id: 1,
    destination_location_id: 1,
    product_id: 1,
    quantity: 5000,
    unit_price: 150,
    notes: 'Seasonal bulk seed purchase',
  });

  const [newGRN, setNewGRN] = useState({
    supplier_id: 1,
    location_id: 1,
    product_id: 1,
    batch_number: 'GRN-BAT-2026-X',
    received_quantity: 5000,
    accepted_quantity: 4950,
    rejected_quantity: 50,
    unit_price: 150,
    moisture_pct: 6.2,
    foreign_matter_pct: 0.8,
    rejection_reason: 'High dust residue in 50 KG lot',
  });

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    code: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    gst_tin: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [oList, rList, sList, pList] = await Promise.all([
        api.getPurchaseOrders(),
        api.getGoodsReceipts(),
        api.getSuppliers(),
        api.getProducts(),
      ]);
      setOrders(oList);
      setReceipts(rList);
      setSuppliers(sList);
      setProducts(pList);
    } catch (err) {
      console.error('Failed to load procurement data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPurchaseOrder({
        supplier_id: newPO.supplier_id,
        destination_location_id: newPO.destination_location_id,
        notes: newPO.notes,
        items: [
          {
            product_id: newPO.product_id,
            quantity: newPO.quantity,
            unit_price: newPO.unit_price,
            tax_percent: 0,
          },
        ],
      });
      setIsPOModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error creating PO: ${err.message}`);
    }
  };

  const handleCreateGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createGoodsReceipt({
        supplier_id: newGRN.supplier_id,
        location_id: newGRN.location_id,
        notes: 'Inward gate inspection completed',
        items: [
          {
            product_id: newGRN.product_id,
            batch_number: newGRN.batch_number,
            received_quantity: newGRN.received_quantity,
            accepted_quantity: newGRN.accepted_quantity,
            rejected_quantity: newGRN.rejected_quantity,
            unit_price: newGRN.unit_price,
            moisture_pct: newGRN.moisture_pct,
            foreign_matter_pct: newGRN.foreign_matter_pct,
            rejection_reason: newGRN.rejection_reason,
          },
        ],
      });
      setIsGRNModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error creating GRN: ${err.message}`);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSupplier(newSupplier);
      setIsSupplierModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error creating supplier: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-700" />
            Procurement & Raw Material Purchasing
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage seed suppliers, purchase orders, Gate Entry Goods Receipts (GRN), and lab inspection grading
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 shadow-2xs flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            New Supplier
          </button>
          <button
            onClick={() => setIsGRNModalOpen(true)}
            className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-xl hover:bg-amber-600 shadow-sm flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5" />
            Receive GRN (Gate Entry)
          </button>
          <button
            onClick={() => setIsPOModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Purchase Order
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'orders', label: 'Purchase Orders', count: orders.length },
            { id: 'grn', label: 'Goods Receipts (GRN)', count: receipts.length },
            { id: 'suppliers', label: 'Suppliers Directory', count: suppliers.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        <button
          onClick={loadData}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((po) => {
                    const item = po.items[0];
                    return (
                      <tr key={po.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{po.po_number}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{po.supplier?.name}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">{item?.product?.name}</span>
                          <span className="text-[10px] text-slate-500 ml-1">
                            (Qty: {Number(item?.quantity)})
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(po.order_date).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={po.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 text-sm">
                          ₹{Number(po.total_amount).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'grn' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">GRN #</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Batch Number Created</th>
                  <th className="py-3 px-4">Received / Accepted Qty</th>
                  <th className="py-3 px-4">Rejected Qty</th>
                  <th className="py-3 px-4">Inspection</th>
                  <th className="py-3 px-4 text-right">Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No Goods Receipts (GRN) logged yet.
                    </td>
                  </tr>
                ) : (
                  receipts.map((grn) => {
                    const item = grn.items[0];
                    return (
                      <tr key={grn.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{grn.grn_number}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{grn.supplier?.name}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-amber-800">
                          {item?.batch_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">{Number(item?.received_quantity)}</span> /{' '}
                          <span className="font-bold text-emerald-700">{Number(item?.accepted_quantity)}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-rose-600">
                          {Number(item?.rejected_quantity || 0)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={grn.inspection_status} />
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                          ₹{Number(grn.total_received_amount).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Phone / Email</th>
                  <th className="py-3 px-4">GST / Tax ID</th>
                  <th className="py-3 px-4">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{s.code}</td>
                    <td className="py-3.5 px-4 text-slate-700">{s.contact_person}</td>
                    <td className="py-3.5 px-4">
                      <div>{s.phone}</div>
                      <div className="text-[10px] text-slate-400">{s.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">{s.gst_tin}</td>
                    <td className="py-3.5 px-4 font-bold text-amber-600">★ {s.rating} / 5.0</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: New PO */}
      <Modal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        title="Create Purchase Order"
        subtitle="Submit seed procurement order to registered agricultural supplier"
      >
        <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Supplier</label>
              <select
                value={newPO.supplier_id}
                onChange={(e) => setNewPO({ ...newPO, supplier_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Raw Seed Item</label>
              <select
                value={newPO.product_id}
                onChange={(e) => setNewPO({ ...newPO, product_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.uom})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                step="any"
                required
                value={newPO.quantity}
                onChange={(e) => setNewPO({ ...newPO, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Agreed Unit Rate (₹)</label>
              <input
                type="number"
                step="any"
                required
                value={newPO.unit_price}
                onChange={(e) => setNewPO({ ...newPO, unit_price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-emerald-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsPOModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              Issue Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: New GRN */}
      <Modal
        isOpen={isGRNModalOpen}
        onClose={() => setIsGRNModalOpen(false)}
        title="Gate Inward Goods Receipt Note (GRN)"
        subtitle="Records raw seed truck arrival, inspection grading, and creates inventory batch"
      >
        <form onSubmit={handleCreateGRN} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Supplier</label>
              <select
                value={newGRN.supplier_id}
                onChange={(e) => setNewGRN({ ...newGRN, supplier_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Inward Batch Number</label>
              <input
                type="text"
                required
                value={newGRN.batch_number}
                onChange={(e) => setNewGRN({ ...newGRN, batch_number: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Received (KG)</label>
              <input
                type="number"
                step="any"
                value={newGRN.received_quantity}
                onChange={(e) => setNewGRN({ ...newGRN, received_quantity: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Accepted (KG)</label>
              <input
                type="number"
                step="any"
                value={newGRN.accepted_quantity}
                onChange={(e) => setNewGRN({ ...newGRN, accepted_quantity: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Rejected (KG)</label>
              <input
                type="number"
                step="any"
                value={newGRN.rejected_quantity}
                onChange={(e) => setNewGRN({ ...newGRN, rejected_quantity: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-rose-700"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Moisture % (Max 6.5%)</label>
              <input
                type="number"
                step="any"
                value={newGRN.moisture_pct}
                onChange={(e) => setNewGRN({ ...newGRN, moisture_pct: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unit Rate (₹)</label>
              <input
                type="number"
                step="any"
                value={newGRN.unit_price}
                onChange={(e) => setNewGRN({ ...newGRN, unit_price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsGRNModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700"
            >
              Confirm GRN & Post Raw Material Batch
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: New Supplier */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title="Register New Supplier"
        subtitle="Add a mandi trader, agricultural farmer cooperative, or packing vendor"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Supplier Name</label>
              <input
                type="text"
                required
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Supplier Code</label>
              <input
                type="text"
                required
                value={newSupplier.code}
                onChange={(e) => setNewSupplier({ ...newSupplier, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={newSupplier.contact_person}
                onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              Register Supplier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
