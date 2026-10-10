import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Layers,
  ArrowRightLeft,
  SlidersHorizontal,
  Package,
} from 'lucide-react';
import { api } from '../services/api';
import { Product, Batch, StockBalance, StockMovement, ProductCategory } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const InventoryPage: React.FC = () => {
  const { currentLocationId, locations } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'batches' | 'balances' | 'movements'>('products');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Forms
  const [newProduct, setNewProduct] = useState({
    name: '',
    code: '',
    sku: '',
    category_id: 1,
    product_type: 'FINISHED_GOOD',
    uom: 'BOTTLE_1L',
    default_price: 0,
    cost_price: 0,
    reorder_level: 50,
    description: '',
  });

  const [newBatch, setNewBatch] = useState({
    batch_number: '',
    product_id: 1,
    location_id: 1,
    initial_quantity: 100,
    cost_per_unit: 0,
    notes: '',
  });

  const [adjustment, setAdjustment] = useState({
    location_id: 1,
    product_id: 1,
    quantity_delta: 0,
    reason: 'Stock count reconciliation',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats, bats, bals, movs] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getBatches(),
        api.getBalances(currentLocationId === 'ALL' ? undefined : { location_id: String(currentLocationId) }),
        api.getMovements(currentLocationId === 'ALL' ? undefined : { location_id: String(currentLocationId) }),
      ]);
      setProducts(prods);
      setCategories(cats);
      setBatches(bats);
      setBalances(bals);
      setMovements(movs);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentLocationId]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct(newProduct);
      setIsProductModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error creating product: ${err.message}`);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBatch(newBatch);
      setIsBatchModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error creating batch: ${err.message}`);
    }
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdjustment(adjustment);
      setIsAdjustModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error adjusting stock: ${err.message}`);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-700" />
            Inventory Master & Stock Ledger
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Centralized product catalog, batch tracking, and immutable stock movement audit ledger
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 shadow-2xs flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            Stock Adjustment
          </button>
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-xl hover:bg-amber-600 shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Batch
          </button>
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Product
          </button>
        </div>
      </div>

      {/* Tabs & Search Navigation */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'products', label: 'Products & SKUs', count: products.length },
            { id: 'balances', label: 'Stock Balances', count: balances.length },
            { id: 'batches', label: 'Batches', count: batches.length },
            { id: 'movements', label: 'Movement Ledger', count: movements.length },
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

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none w-52 focus:border-emerald-500"
            />
          </div>
          <button
            onClick={loadData}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500"
            title="Refresh Table"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content Tables */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Code / SKU</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">UOM</th>
                  <th className="py-3 px-4">Cost Price</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Reorder Level</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] text-slate-800 font-semibold">{p.code}</div>
                      <div className="text-[10px] text-slate-400">{p.sku}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                        {p.product_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{p.uom}</td>
                    <td className="py-3.5 px-4 text-slate-600">₹{p.cost_price}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">₹{p.default_price}</td>
                    <td className="py-3.5 px-4 text-amber-700 font-bold">{p.reorder_level}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">On Hand Qty</th>
                  <th className="py-3 px-4">Reserved</th>
                  <th className="py-3 px-4">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {balances.map((b) => {
                  const loc = locations.find((l) => l.id === b.location_id);
                  const prod = products.find((p) => p.id === b.product_id);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {loc ? loc.name : `Location ${b.location_id}`}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {prod ? prod.name : `Product ${b.product_id}`}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {b.batch ? b.batch.batch_number : 'Aggregated'}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm">
                        {Number(b.quantity).toLocaleString()} {prod?.uom}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{Number(b.reserved_quantity)}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        {(Number(b.quantity) - Number(b.reserved_quantity)).toLocaleString()}{' '}
                        {prod?.uom}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'batches' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Initial Qty</th>
                  <th className="py-3 px-4">Current Qty</th>
                  <th className="py-3 px-4">Unit Cost</th>
                  <th className="py-3 px-4">Mfg Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {batches.map((bat) => {
                  const prod = products.find((p) => p.id === bat.product_id);
                  return (
                    <tr key={bat.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {bat.batch_number}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {prod ? prod.name : `Product ${bat.product_id}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{Number(bat.initial_quantity)}</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {Number(bat.current_quantity)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">₹{bat.cost_per_unit}</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(bat.manufacturing_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={bat.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Movement #</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Quantity Delta</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {movements.map((m) => {
                  const prod = products.find((p) => p.id === m.product_id);
                  const isPositive = Number(m.quantity) >= 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-800">
                        {m.movement_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={m.movement_type} />
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {prod ? prod.name : `Product ${m.product_id}`}
                      </td>
                      <td
                        className={`py-3.5 px-4 font-extrabold ${
                          isPositive ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isPositive ? `+${m.quantity}` : m.quantity} {prod?.uom}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {m.balance_after} {prod?.uom}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        <span className="font-semibold text-slate-700">{m.reference_type}</span> (
                        {m.reference_id})
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(m.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: New Product */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Create New Product"
        subtitle="Add a raw seed, finished cold-pressed oil, or by-product to the master catalog"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Product Name</label>
            <input
              type="text"
              required
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              placeholder="e.g. Organic Cold-Pressed Sesame Oil 1L"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Code</label>
              <input
                type="text"
                required
                value={newProduct.code}
                onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                placeholder="e.g. OIL-CPO-1L"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">SKU</label>
              <input
                type="text"
                required
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                placeholder="e.g. SKU-OIL-01"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Type</label>
              <select
                value={newProduct.product_type}
                onChange={(e) => setNewProduct({ ...newProduct, product_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                <option value="RAW_MATERIAL">RAW MATERIAL (Seeds)</option>
                <option value="INTERMEDIATE">INTERMEDIATE (Bulk Oil)</option>
                <option value="FINISHED_GOOD">FINISHED GOOD (Bottled Oil)</option>
                <option value="BY_PRODUCT">BY-PRODUCT (Sesame Cake/Pinac)</option>
                <option value="PACKAGING">PACKAGING (Bottles/Caps)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unit of Measure (UOM)</label>
              <select
                value={newProduct.uom}
                onChange={(e) => setNewProduct({ ...newProduct, uom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                <option value="KG">KG</option>
                <option value="LITER">LITER</option>
                <option value="BOTTLE_1L">BOTTLE 1L</option>
                <option value="BOTTLE_500ML">BOTTLE 500ML</option>
                <option value="TIN_15L">TIN 15L</option>
                <option value="BAG_50KG">BAG 50KG</option>
                <option value="PIECE">PIECE</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cost Price (₹)</label>
              <input
                type="number"
                value={newProduct.cost_price}
                onChange={(e) => setNewProduct({ ...newProduct, cost_price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Selling Price (₹)</label>
              <input
                type="number"
                value={newProduct.default_price}
                onChange={(e) => setNewProduct({ ...newProduct, default_price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Reorder Level</label>
              <input
                type="number"
                value={newProduct.reorder_level}
                onChange={(e) => setNewProduct({ ...newProduct, reorder_level: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: New Batch */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Register Opening / Inward Batch"
        subtitle="Log an incoming lot or production batch into specific warehouse location"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Batch Number</label>
            <input
              type="text"
              required
              value={newBatch.batch_number}
              onChange={(e) => setNewBatch({ ...newBatch, batch_number: e.target.value })}
              placeholder="e.g. BAT-SESAME-2026-09"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Product</label>
              <select
                value={newBatch.product_id}
                onChange={(e) => setNewBatch({ ...newBatch, product_id: Number(e.target.value) })}
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
              <label className="block font-bold text-slate-700 mb-1">Warehouse Location</label>
              <select
                value={newBatch.location_id}
                onChange={(e) => setNewBatch({ ...newBatch, location_id: Number(e.target.value) })}
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
              <label className="block font-bold text-slate-700 mb-1">Initial Quantity</label>
              <input
                type="number"
                step="any"
                required
                value={newBatch.initial_quantity}
                onChange={(e) => setNewBatch({ ...newBatch, initial_quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cost Per Unit (₹)</label>
              <input
                type="number"
                step="any"
                value={newBatch.cost_per_unit}
                onChange={(e) => setNewBatch({ ...newBatch, cost_per_unit: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700"
            >
              Register Batch & Post Opening Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Stock Adjustment */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Stock Adjustment Reconciliation"
        subtitle="Manually adjust inventory following a physical count audit"
      >
        <form onSubmit={handleAdjustment} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Location</label>
              <select
                value={adjustment.location_id}
                onChange={(e) => setAdjustment({ ...adjustment, location_id: Number(e.target.value) })}
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
              <label className="block font-bold text-slate-700 mb-1">Product</label>
              <select
                value={adjustment.product_id}
                onChange={(e) => setAdjustment({ ...adjustment, product_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Quantity Delta (+ to increase, - to deduct)
            </label>
            <input
              type="number"
              step="any"
              required
              value={adjustment.quantity_delta}
              onChange={(e) => setAdjustment({ ...adjustment, quantity_delta: Number(e.target.value) })}
              placeholder="e.g. +10 or -5"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for Adjustment</label>
            <input
              type="text"
              required
              value={adjustment.reason}
              onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900"
            >
              Post Ledger Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
