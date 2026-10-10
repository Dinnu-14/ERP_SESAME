export type UserRole =
  | 'SUPER_ADMIN'
  | 'FACTORY_MANAGER'
  | 'PRODUCTION_MANAGER'
  | 'STORE_MANAGER'
  | 'FRANCHISE_MANAGER'
  | 'INVENTORY_OPERATOR'
  | 'B2B_SALES_MANAGER'
  | 'HR_MANAGER'
  | 'QUALITY_MANAGER'
  | 'ACCOUNTANT'
  | 'EMPLOYEE'
  | 'AUDITOR';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  organization_id?: number;
  location_id?: number;
  is_active: boolean;
  created_at: string;
}

export interface Organization {
  id: number;
  name: string;
  code: string;
  description?: string;
  created_at: string;
}

export type LocationType = 'FACTORY' | 'WAREHOUSE' | 'FRANCHISE_BRANCH' | 'PRODUCTION_UNIT';

export interface Location {
  id: number;
  organization_id: number;
  name: string;
  code: string;
  location_type: LocationType;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contact_number?: string;
  manager_name?: string;
  is_active: boolean;
  created_at: string;
}

export type UnitOfMeasure = 'KG' | 'LITER' | 'BAG_50KG' | 'BOTTLE_1L' | 'BOTTLE_500ML' | 'TIN_15L' | 'BOX' | 'PIECE';
export type ProductType = 'RAW_MATERIAL' | 'INTERMEDIATE' | 'FINISHED_GOOD' | 'BY_PRODUCT' | 'PACKAGING';

export interface ProductCategory {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  category_id?: number;
  name: string;
  code: string;
  sku: string;
  product_type: ProductType;
  uom: UnitOfMeasure;
  default_price: number;
  cost_price: number;
  reorder_level: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  category?: ProductCategory;
}

export interface Batch {
  id: number;
  batch_number: string;
  product_id: number;
  location_id?: number;
  initial_quantity: number;
  current_quantity: number;
  cost_per_unit: number;
  status: string;
  manufacturing_date: string;
  expiry_date?: string;
  notes?: string;
  product?: Product;
}

export interface StockBalance {
  id: number;
  location_id: number;
  product_id: number;
  batch_id?: number;
  quantity: number;
  reserved_quantity: number;
  product?: Product;
  batch?: Batch;
}

export interface StockMovement {
  id: number;
  movement_number: string;
  reference_type: string;
  reference_id: string;
  product_id: number;
  batch_id?: number;
  location_id: number;
  movement_type: string;
  quantity: number;
  balance_after: number;
  unit_cost: number;
  notes?: string;
  created_at: string;
}

export type TransferStatus = 'REQUESTED' | 'APPROVED' | 'DISPATCHED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface TransferItem {
  id: number;
  transfer_id: number;
  product_id: number;
  batch_id?: number;
  requested_quantity: number;
  dispatched_quantity: number;
  received_quantity: number;
  damaged_quantity: number;
  notes?: string;
  product?: Product;
  batch?: Batch;
}

export interface TransferOrder {
  id: number;
  transfer_number: string;
  source_location_id: number;
  destination_location_id: number;
  status: TransferStatus;
  notes?: string;
  requested_by_id?: number;
  approved_by_id?: number;
  dispatched_by_id?: number;
  received_by_id?: number;
  requested_at: string;
  approved_at?: string;
  dispatched_at?: string;
  received_at?: string;
  created_at: string;
  items: TransferItem[];
}

export interface ProductionQualityCheck {
  id: number;
  batch_id: number;
  test_date: string;
  free_fatty_acids_pct?: number;
  moisture_pct?: number;
  color?: string;
  odor?: string;
  density_g_ml?: number;
  status: 'PENDING' | 'PASSED' | 'REJECTED';
  tested_by_id?: number;
  comments?: string;
}

export interface ProductionBatch {
  id: number;
  batch_number: string;
  location_id: number;
  seed_product_id: number;
  seed_batch_id: number;
  seed_input_qty: number;
  oil_product_id: number;
  oil_output_qty: number;
  oil_batch_number?: string;
  cake_product_id: number;
  cake_output_qty: number;
  cake_batch_number?: string;
  recorded_loss_qty: number;
  unexplained_variance_qty: number;
  expected_oil_yield_pct: number;
  actual_oil_yield_pct: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'QUALITY_CHECK' | 'APPROVED' | 'COMPLETED' | 'FLAGGED';
  notes?: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
  quality_checks: ProductionQualityCheck[];
  seed_product?: Product;
  oil_product?: Product;
  cake_product?: Product;
}

export interface Supplier {
  id: number;
  name: string;
  code: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  gst_tin?: string;
  rating: number;
  is_active: boolean;
}

export interface PurchaseOrderItem {
  id: number;
  po_id: number;
  product_id: number;
  quantity: number;
  received_quantity: number;
  unit_price: number;
  tax_percent: number;
  total_amount: number;
  product?: Product;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  destination_location_id: number;
  order_date: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';
  total_amount: number;
  payment_terms: string;
  notes?: string;
  created_at: string;
  supplier?: Supplier;
  items: PurchaseOrderItem[];
}

export interface GoodsReceiptItem {
  id: number;
  grn_id: number;
  product_id: number;
  batch_number: string;
  received_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  unit_price: number;
  product?: Product;
}

export interface GoodsReceipt {
  id: number;
  grn_number: string;
  po_id?: number;
  supplier_id: number;
  location_id: number;
  received_date: string;
  supplier_invoice_no?: string;
  inspection_status: string;
  total_received_amount: number;
  notes?: string;
  created_at: string;
  supplier?: Supplier;
  items: GoodsReceiptItem[];
}

export interface FranchiseExtraction {
  id: number;
  extraction_number: string;
  location_id: number;
  ownership: 'COMPANY_OWNED' | 'CUSTOMER_OWNED';
  customer_name?: string;
  customer_phone?: string;
  service_charge: number;
  is_service_paid: boolean;
  seed_product_id: number;
  seed_input_qty: number;
  oil_output_qty: number;
  cake_output_qty: number;
  waste_qty: number;
  date: string;
  notes?: string;
  seed_product?: Product;
}

export interface FranchiseSaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  batch_id?: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

export interface FranchiseSale {
  id: number;
  invoice_number: string;
  location_id: number;
  customer_name: string;
  customer_phone?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
  sale_date: string;
  notes?: string;
  items: FranchiseSaleItem[];
}

export interface B2BCustomer {
  id: number;
  customer_code: string;
  company_name: string;
  contact_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  gst_tin?: string;
  credit_limit: number;
  payment_terms_days: number;
  is_active: boolean;
}

export interface B2BSalesOrder {
  id: number;
  so_number: string;
  customer_id: number;
  location_id: number;
  order_date: string;
  delivery_due_date?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'APPROVED' | 'RESERVED' | 'DISPATCHED' | 'INVOICED' | 'COMPLETED' | 'CANCELLED';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  customer?: B2BCustomer;
  items: any[];
}

export interface WastageRecord {
  id: number;
  waste_number: string;
  location_id: number;
  product_id: number;
  batch_id?: number;
  quantity: number;
  wastage_type: string;
  estimated_cost: number;
  reason: string;
  disposal_method: string;
  is_recoverable: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  date: string;
  product?: Product;
}

export interface Employee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department: string;
  job_title: string;
  location_id?: number;
  shift: string;
  employment_status: string;
  date_of_joining: string;
}

export interface SOP {
  id: number;
  code: string;
  title: string;
  category: string;
  department: string;
  description?: string;
  versions: any[];
  acknowledgments: any[];
}

export interface DashboardData {
  kpis: {
    raw_seeds: { title: string; value: string; numeric_value: number; unit?: string; change_pct?: number; subtext?: string };
    finished_oil: { title: string; value: string; numeric_value: number; unit?: string; change_pct?: number; subtext?: string };
    oil_yield: { title: string; value: string; numeric_value: number; unit?: string; change_pct?: number; subtext?: string };
    total_revenue: { title: string; value: string; numeric_value: number; unit?: string; change_pct?: number; subtext?: string };
    in_transit: { title: string; value: string; numeric_value: number; unit?: string; subtext?: string };
  };
  branch_stocks: { location_id: number; location_name: string; location_type: string; total_items_count: number; total_stock_units: number; total_valuation: number }[];
  production_trends: { period: string; seed_consumed_kg: number; oil_produced_l: number; cake_produced_kg: number; yield_pct: number }[];
  sales_trends: { date: string; retail_sales: number; b2b_sales: number; total_sales: number }[];
  low_stock_alerts: { product_id: number; product_name: string; location_name: string; current_stock: number; reorder_level: number; uom: string }[];
  pending_transfers_count: number;
  pending_wastage_count: number;
  sop_compliance_pct: number;
  attendance_rate_pct: number;
}
