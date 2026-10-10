from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from decimal import Decimal

class KPIValue(BaseModel):
    title: str
    value: str
    numeric_value: float
    unit: Optional[str] = None
    change_pct: Optional[float] = None
    subtext: Optional[str] = None

class BranchStockSummary(BaseModel):
    location_id: int
    location_name: str
    location_type: str
    total_items_count: int
    total_stock_units: float
    total_valuation: float

class ProductionMetric(BaseModel):
    period: str
    seed_consumed_kg: float
    oil_produced_l: float
    cake_produced_kg: float
    yield_pct: float

class SalesTrend(BaseModel):
    date: str
    retail_sales: float
    b2b_sales: float
    total_sales: float

class LowStockAlert(BaseModel):
    product_id: int
    product_name: str
    location_name: str
    current_stock: float
    reorder_level: float
    uom: str

class UnifiedDashboardData(BaseModel):
    kpis: Dict[str, KPIValue]
    branch_stocks: List[BranchStockSummary]
    production_trends: List[ProductionMetric]
    sales_trends: List[SalesTrend]
    low_stock_alerts: List[LowStockAlert]
    pending_transfers_count: int
    pending_wastage_count: int
    sop_compliance_pct: float
    attendance_rate_pct: float
