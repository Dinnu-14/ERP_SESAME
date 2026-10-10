import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Plus,
  Send,
  CreditCard,
  RefreshCw,
  FileText,
  Building,
  CheckCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { B2BCustomer, B2BSalesOrder, Product } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';

export const B2BPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'invoices' | 'customers'>('orders');
  const [customers, setCustomers] = useState<B2BCustomer[]>([]);
  const [orders, setOrders] = useState<B2BSalesOrder[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Form states
  const [newOrder, setNewOrder] = useState({
    customer_id: 1,
    location_id: 2, // Factory warehouse
    product_id: 3,
    quantity: 100,
    unit_price: 380,
    notes: 'Wholesale distributor dispatch',
  });

  const [newCustomer, setNewCustomer] = useState({
    customer_code: '',
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Bengaluru',
    gst_tin: '',
    credit_limit: 500000,
    payment_terms_days: 30,
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 10000,
    payment_method: 'RTGS',
    reference_number: '',
    notes: 'Commercial payment credit',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, oList, iList, pList] = await Promise.all([
        api.getB2BCustomers(),
        api.getB2BOrders(),
        api.getB2BInvoices(),
        api.getProducts(),
      ]);
      setCustomers(cList);
      setOrders(oList);
      setInvoices(iList);
      setProducts(pList);
    } catch (err) {
      console.error('Failed to load B2B data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createB2BOrder({
        customer_id: newOrder.customer_id,
        location_id: newOrder.location_id,
        notes: newOrder.notes,
        items: [
          {
            product_id: newOrder.product_id,
            quantity: newOrder.quantity,
            unit_price: newOrder.unit_price,
            tax_percent: 5,
          },
        ],
      });
      setIsOrderModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error creating order: ${err.message}`);
    }
  };

  const handleDispatchOrder = async (id: number) => {
    try {
      await api.dispatchB2BOrder(id);
      loadData();
    } catch (err: any) {
      alert(`Error dispatching order: ${err.message}`);
    }
  };

  const handleOpenPayment = (inv: any) => {
    setSelectedInvoice(inv);
    setPaymentForm({
      amount: Number(inv.total_amount) - Number(inv.paid_amount),
      payment_method: 'RTGS',
      reference_number: 'UTR-' + Date.now(),
      notes: 'Payment clearance',
    });
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await api.recordB2BPayment(selectedInvoice.id, paymentForm);
      setIsPaymentModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error recording payment: ${err.message}`);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createB2BCustomer(newCustomer);
      setIsCustomerModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error creating customer: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-700" />
            B2B Wholesale & Commercial Sales
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Distributor pricing, sales orders, warehouse dispatch, GST invoices, and accounts receivable
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 shadow-2xs flex items-center gap-1.5"
          >
            <Building className="w-3.5 h-3.5 text-slate-500" />
            New Customer
          </button>
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Sales Order
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'orders', label: 'Sales Orders', count: orders.length },
            { id: 'invoices', label: 'Tax Invoices & AR', count: invoices.length },
            { id: 'customers', label: 'Wholesale Accounts', count: customers.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-800 shadow-xs'
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
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">SO Number</th>
                  <th className="py-3 px-4">Wholesale Client</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total Amount (Inc. GST)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No B2B sales orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((so) => (
                    <tr key={so.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{so.so_number}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {so.customer?.company_name || 'Wholesale Client'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(so.order_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={so.status} />
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-blue-800 text-sm">
                        ₹{Number(so.total_amount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {so.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleDispatchOrder(so.id)}
                            className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold text-[11px] hover:bg-blue-700 shadow-2xs inline-flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Dispatch & Generate Invoice
                          </button>
                        )}
                        {so.status === 'DISPATCHED' && (
                          <span className="text-emerald-700 font-semibold text-[11px] flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Invoiced & Dispatched
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid Amount</th>
                  <th className="py-3 px-4">Balance Due</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No invoices generated yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const due = Number(inv.total_amount) - Number(inv.paid_amount);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(inv.invoice_date).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          ₹{Number(inv.total_amount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-700">
                          ₹{Number(inv.paid_amount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-rose-700">
                          ₹{due.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {inv.status !== 'PAID' && (
                            <button
                              onClick={() => handleOpenPayment(inv)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700 shadow-2xs inline-flex items-center gap-1"
                            >
                              <CreditCard className="w-3 h-3" />
                              Receive Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">GST TIN</th>
                  <th className="py-3 px-4">Credit Limit (₹)</th>
                  <th className="py-3 px-4">Payment Terms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.company_name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{c.customer_code}</td>
                    <td className="py-3.5 px-4 text-slate-700">{c.contact_name}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">{c.gst_tin}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      ₹{Number(c.credit_limit).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{c.payment_terms_days} Days Net</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: New Sales Order */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Create Wholesale Sales Order"
        subtitle="Book commercial order with customer-specific pricing and stock reservation"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Wholesale Customer</label>
              <select
                value={newOrder.customer_id}
                onChange={(e) => setNewOrder({ ...newOrder, customer_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Product</label>
              <select
                value={newOrder.product_id}
                onChange={(e) => setNewOrder({ ...newOrder, product_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                step="any"
                required
                value={newOrder.quantity}
                onChange={(e) => setNewOrder({ ...newOrder, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Negotiated Wholesale Price (₹)</label>
              <input
                type="number"
                step="any"
                required
                value={newOrder.unit_price}
                onChange={(e) => setNewOrder({ ...newOrder, unit_price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-blue-800"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Order Notes / Delivery Terms</label>
            <input
              type="text"
              value={newOrder.notes}
              onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
            >
              Confirm Sales Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Receive Payment */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Commercial Payment Receipt"
        subtitle={`Invoice: ${selectedInvoice?.invoice_number}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Amount (₹)</label>
              <input
                type="number"
                step="any"
                required
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-emerald-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                <option value="RTGS">RTGS</option>
                <option value="NEFT">NEFT</option>
                <option value="CHEQUE">Cheque Clearance</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Bank Reference / UTR Number</label>
            <input
              type="text"
              required
              value={paymentForm.reference_number}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              Post Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: New Customer */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Add B2B Wholesale Customer"
        subtitle="Register distributor, supermarket chain, or institutional buyer"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company / Trade Name</label>
              <input
                type="text"
                required
                value={newCustomer.company_name}
                onChange={(e) => setNewCustomer({ ...newCustomer, company_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer Code</label>
              <input
                type="text"
                required
                value={newCustomer.customer_code}
                onChange={(e) => setNewCustomer({ ...newCustomer, customer_code: e.target.value })}
                placeholder="e.g. CUST-DIST-01"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                required
                value={newCustomer.contact_name}
                onChange={(e) => setNewCustomer({ ...newCustomer, contact_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mobile / Phone</label>
              <input
                type="text"
                required
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">GST TIN Number</label>
              <input
                type="text"
                value={newCustomer.gst_tin}
                onChange={(e) => setNewCustomer({ ...newCustomer, gst_tin: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Credit Limit (₹)</label>
              <input
                type="number"
                value={newCustomer.credit_limit}
                onChange={(e) => setNewCustomer({ ...newCustomer, credit_limit: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
            >
              Save Customer Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
