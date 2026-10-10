import React, { useEffect, useState } from 'react';
import {
  Store,
  ShoppingCart,
  Plus,
  RefreshCw,
  Coins,
  Send,
  Building2,
  Trash2,
  Receipt,
  UserCheck,
} from 'lucide-react';
import { api } from '../services/api';
import {
  FranchiseExtraction,
  FranchiseSale,
  Product,
  Location,
} from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const FranchisePage: React.FC = () => {
  const { locations, currentLocationId } = useAuth();
  const [activeTab, setActiveTab] = useState<'sales' | 'extractions' | 'replenishments'>('sales');
  
  const [sales, setSales] = useState<FranchiseSale[]>([]);
  const [extractions, setExtractions] = useState<FranchiseExtraction[]>([]);
  const [replenishments, setReplenishments] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false);
  const [isRepModalOpen, setIsRepModalOpen] = useState(false);

  // Default active franchise branch (e.g. SUFALA Bangalore #3)
  const defaultBranchId =
    currentLocationId !== 'ALL' ? currentLocationId : (locations.find((l) => l.location_type === 'FRANCHISE_BRANCH')?.id || 3);

  // POS Sale Form State
  const [posForm, setPosForm] = useState({
    location_id: defaultBranchId,
    customer_name: 'Walk-in Retail Buyer',
    customer_phone: '9876543210',
    payment_method: 'UPI',
    product_id: 3, // 1L bottle
    quantity: 2,
    unit_price: 420,
    notes: 'Counter sales slip',
  });

  // Extraction Form State (Process A)
  const [extForm, setExtForm] = useState({
    location_id: defaultBranchId,
    ownership: 'CUSTOMER_OWNED', // or COMPANY_OWNED
    customer_name: 'Suresh Patil (Farmer/Consumer)',
    customer_phone: '9845112233',
    service_charge: 150,
    seed_product_id: 1,
    seed_input_qty: 25,
    oil_output_qty: 11.5,
    cake_output_qty: 13.0,
    waste_qty: 0.5,
    notes: 'Live cold-press customer milling demo',
  });

  // Replenishment Form State
  const [repForm, setRepForm] = useState({
    location_id: defaultBranchId,
    product_id: 3,
    requested_quantity: 50,
    notes: 'Replenishment for weekend rush',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [sList, eList, rList, pList] = await Promise.all([
        api.getFranchiseSales(currentLocationId === 'ALL' ? undefined : { location_id: String(currentLocationId) }),
        api.getFranchiseExtractions(currentLocationId === 'ALL' ? undefined : { location_id: String(currentLocationId) }),
        api.getReplenishments(currentLocationId === 'ALL' ? undefined : { location_id: String(currentLocationId) }),
        api.getProducts(),
      ]);
      setSales(sList);
      setExtractions(eList);
      setReplenishments(rList);
      setProducts(pList);
    } catch (err) {
      console.error('Failed to load franchise data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentLocationId]);

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFranchiseSale({
        location_id: posForm.location_id,
        customer_name: posForm.customer_name,
        customer_phone: posForm.customer_phone,
        payment_method: posForm.payment_method,
        notes: posForm.notes,
        items: [
          {
            product_id: posForm.product_id,
            quantity: posForm.quantity,
            unit_price: posForm.unit_price,
          },
        ],
      });
      setIsSaleModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error recording sale: ${err.message}`);
    }
  };

  const handleRecordExtraction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFranchiseExtraction(extForm);
      setIsExtractionModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error recording extraction: ${err.message}`);
    }
  };

  const handleCreateReplenishment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createReplenishment({
        location_id: repForm.location_id,
        notes: repForm.notes,
        items: [
          {
            product_id: repForm.product_id,
            requested_quantity: repForm.requested_quantity,
          },
        ],
      });
      setIsRepModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error submitting replenishment: ${err.message}`);
    }
  };

  const franchiseLocations = locations.filter((l) => l.location_type === 'FRANCHISE_BRANCH');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-amber-600" />
            SUFALA Franchise Branch Management
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Dual operational flows: Process A (Live Seed Extraction) & Process B (Retail Product POS Sales)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRepModalOpen(true)}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 shadow-2xs flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-slate-500" />
            Replenishment Request
          </button>
          <button
            onClick={() => setIsExtractionModalOpen(true)}
            className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-xl hover:bg-amber-600 shadow-sm flex items-center gap-1.5"
          >
            <Coins className="w-3.5 h-3.5" />
            Process A: Live Seed Extraction
          </button>
          <button
            onClick={() => setIsSaleModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm flex items-center gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Process B: Retail POS Sale
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'sales', label: 'Process B: Retail POS Sales', count: sales.length },
            { id: 'extractions', label: 'Process A: Seed Extraction', count: extractions.length },
            { id: 'replenishments', label: 'Replenishment Requests', count: replenishments.length },
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

      {/* Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {activeTab === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Branch Location</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Sold</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No retail sales recorded. Click "Process B: Retail POS Sale" to ring up an order.
                    </td>
                  </tr>
                ) : (
                  sales.map((s) => {
                    const loc = locations.find((l) => l.id === s.location_id);
                    const item = s.items[0];
                    const prod = item?.product;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {s.invoice_number}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {loc?.name || `Loc ${s.location_id}`}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="font-bold">{s.customer_name}</div>
                          <div className="text-[10px] text-slate-400">{s.customer_phone || 'Walk-in'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">{prod?.name || 'Retail Item'}</span>
                          <span className="text-[10px] text-slate-500 ml-1">
                            (x{Number(item?.quantity || 1)})
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            {s.payment_method}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(s.sale_date).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 text-sm">
                          ₹{Number(s.total_amount).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'extractions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Extraction #</th>
                  <th className="py-3 px-4">Branch Location</th>
                  <th className="py-3 px-4">Material Ownership</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Seed In (KG)</th>
                  <th className="py-3 px-4">Oil Yield (L)</th>
                  <th className="py-3 px-4">Cake Yield (KG)</th>
                  <th className="py-3 px-4 text-right">Service Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {extractions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No branch extractions logged yet.
                    </td>
                  </tr>
                ) : (
                  extractions.map((e) => {
                    const loc = locations.find((l) => l.id === e.location_id);
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {e.extraction_number}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {loc?.name || `Loc ${e.location_id}`}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              e.ownership === 'CUSTOMER_OWNED'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-purple-50 text-purple-800 border border-purple-200'
                            }`}
                          >
                            {e.ownership.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {e.customer_name || 'Company Stock'}
                          </div>
                          <div className="text-[10px] text-slate-400">{e.customer_phone}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-700">
                          {Number(e.seed_input_qty)} KG
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                          {Number(e.oil_output_qty)} L
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {Number(e.cake_output_qty)} KG
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                          ₹{Number(e.service_charge)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'replenishments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Request #</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Item Requested</th>
                  <th className="py-3 px-4">Requested Qty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {replenishments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No active replenishment requests.
                    </td>
                  </tr>
                ) : (
                  replenishments.map((r) => {
                    const loc = locations.find((l) => l.id === r.location_id);
                    const item = r.items?.[0];
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {r.request_number}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{loc?.name}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {item?.product?.name || 'Assorted Replenishment'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {Number(item?.requested_quantity || 0)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Process B - Retail Sale */}
      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        title="Ring Up Retail Sale (POS Counter)"
        subtitle="Generates immediate invoice receipt and decrements branch stock"
      >
        <form onSubmit={handleRecordSale} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Branch Store</label>
              <select
                value={posForm.location_id}
                onChange={(e) => setPosForm({ ...posForm, location_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                {franchiseLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={posForm.payment_method}
                onChange={(e) => setPosForm({ ...posForm, payment_method: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={posForm.customer_name}
                onChange={(e) => setPosForm({ ...posForm, customer_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer Mobile</label>
              <input
                type="text"
                value={posForm.customer_phone}
                onChange={(e) => setPosForm({ ...posForm, customer_phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Product</label>
              <select
                value={posForm.product_id}
                onChange={(e) => {
                  const pid = Number(e.target.value);
                  const p = products.find((prod) => prod.id === pid);
                  setPosForm({
                    ...posForm,
                    product_id: pid,
                    unit_price: Number(p?.default_price || 420),
                  });
                }}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              >
                {products
                  .filter((p) => p.product_type === 'FINISHED_GOOD' || p.product_type === 'BY_PRODUCT')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                step="any"
                required
                value={posForm.quantity}
                onChange={(e) => setPosForm({ ...posForm, quantity: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unit Price (₹)</label>
              <input
                type="number"
                step="any"
                required
                value={posForm.unit_price}
                onChange={(e) => setPosForm({ ...posForm, unit_price: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-emerald-700"
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="font-bold text-emerald-900 text-xs">Total Bill Amount:</span>
            <span className="text-lg font-extrabold text-emerald-800">
              ₹{(posForm.quantity * posForm.unit_price).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsSaleModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              Print Receipt & Post Sale
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Process A - Live Extraction */}
      <Modal
        isOpen={isExtractionModalOpen}
        onClose={() => setIsExtractionModalOpen(false)}
        title="Process A: Live Seed Extraction (Store Expeller)"
        subtitle="Milling for consumer or processing store seeds into virgin oil"
      >
        <form onSubmit={handleRecordExtraction} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Seed Ownership Type</label>
              <select
                value={extForm.ownership}
                onChange={(e) => setExtForm({ ...extForm, ownership: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              >
                <option value="CUSTOMER_OWNED">
                  CUSTOMER OWNED (Do NOT deduct company stock; charge service fee)
                </option>
                <option value="COMPANY_OWNED">
                  COMPANY OWNED (Deduct branch seed; credit branch oil)
                </option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Service Fee Charged (₹)</label>
              <input
                type="number"
                step="any"
                value={extForm.service_charge}
                onChange={(e) =>
                  setExtForm({ ...extForm, service_charge: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-emerald-800"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={extForm.customer_name}
                onChange={(e) => setExtForm({ ...extForm, customer_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer Mobile</label>
              <input
                type="text"
                value={extForm.customer_phone}
                onChange={(e) => setExtForm({ ...extForm, customer_phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Seed Input (KG)</label>
              <input
                type="number"
                step="any"
                required
                value={extForm.seed_input_qty}
                onChange={(e) =>
                  setExtForm({ ...extForm, seed_input_qty: Number(e.target.value) })
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-amber-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Oil Output (L)</label>
              <input
                type="number"
                step="any"
                required
                value={extForm.oil_output_qty}
                onChange={(e) =>
                  setExtForm({ ...extForm, oil_output_qty: Number(e.target.value) })
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-emerald-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cake Output (KG)</label>
              <input
                type="number"
                step="any"
                required
                value={extForm.cake_output_qty}
                onChange={(e) =>
                  setExtForm({ ...extForm, cake_output_qty: Number(e.target.value) })
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-700"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsExtractionModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700"
            >
              Record Extraction & Print Slip
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Replenishment Request */}
      <Modal
        isOpen={isRepModalOpen}
        onClose={() => setIsRepModalOpen(false)}
        title="Submit Stock Replenishment Request"
        subtitle="Requests fresh batches dispatched from Central Factory"
      >
        <form onSubmit={handleCreateReplenishment} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Branch</label>
              <select
                value={repForm.location_id}
                onChange={(e) => setRepForm({ ...repForm, location_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                {franchiseLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Product</label>
              <select
                value={repForm.product_id}
                onChange={(e) => setRepForm({ ...repForm, product_id: Number(e.target.value) })}
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
          <div>
            <label className="block font-bold text-slate-700 mb-1">Requested Quantity</label>
            <input
              type="number"
              step="any"
              required
              value={repForm.requested_quantity}
              onChange={(e) =>
                setRepForm({ ...repForm, requested_quantity: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              value={repForm.notes}
              onChange={(e) => setRepForm({ ...repForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsRepModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              Transmit Request to Factory
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
