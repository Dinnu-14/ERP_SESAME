from decimal import Decimal
from datetime import datetime
from typing import Optional, List
import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.franchise import (
    FranchiseExtraction, FranchiseSale, FranchiseSaleItem,
    ReplenishmentRequest, ReplenishmentRequestItem,
    MaterialOwnership, PaymentMethod, ReplenishmentStatus
)
from app.models.inventory import MovementType, Batch, StockBalance
from app.services.inventory_service import update_stock

def generate_extraction_number() -> str:
    return f"EXT-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{uuid.uuid4().hex[:4].upper()}"

def generate_sale_invoice_number() -> str:
    return f"SUF-INV-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

def record_franchise_extraction(
    db: Session,
    location_id: int,
    ownership: MaterialOwnership,
    seed_product_id: int,
    seed_input_qty: Decimal,
    oil_output_qty: Decimal,
    cake_output_qty: Decimal,
    waste_qty: Decimal = Decimal("0.0000"),
    seed_batch_id: Optional[int] = None,
    customer_name: Optional[str] = None,
    customer_phone: Optional[str] = None,
    service_charge: Decimal = Decimal("0.00"),
    is_service_paid: bool = True,
    operator_id: Optional[int] = None,
    notes: Optional[str] = None
) -> FranchiseExtraction:
    ext_number = generate_extraction_number()

    # If COMPANY_OWNED seeds, we must deduct seed from the branch's inventory
    # and add the produced oil and cake to branch stock.
    # If CUSTOMER_OWNED, seeds belong to the customer, so we do NOT adjust company seed/oil inventory,
    # but we record the extraction service and service charge!
    if ownership == MaterialOwnership.COMPANY_OWNED:
        # Deduct seed
        update_stock(
            db=db,
            location_id=location_id,
            product_id=seed_product_id,
            quantity_delta=-seed_input_qty,
            movement_type=MovementType.PRODUCTION_CONSUMPTION,
            reference_type="FRANCHISE_EXTRACTION",
            reference_id=ext_number,
            batch_id=seed_batch_id,
            notes=f"SUFALA branch extraction {ext_number}",
            user_id=operator_id
        )

    extraction = FranchiseExtraction(
        extraction_number=ext_number,
        location_id=location_id,
        ownership=ownership,
        customer_name=customer_name,
        customer_phone=customer_phone,
        service_charge=service_charge,
        is_service_paid=is_service_paid,
        seed_product_id=seed_product_id,
        seed_batch_id=seed_batch_id,
        seed_input_qty=seed_input_qty,
        oil_output_qty=oil_output_qty,
        cake_output_qty=cake_output_qty,
        waste_qty=waste_qty,
        date=datetime.utcnow(),
        operator_id=operator_id,
        notes=notes
    )
    db.add(extraction)
    db.commit()
    db.refresh(extraction)
    return extraction

def record_franchise_sale(
    db: Session,
    location_id: int,
    items_data: List[dict],
    customer_name: str = "Walk-in Customer",
    customer_phone: Optional[str] = None,
    payment_method: PaymentMethod = PaymentMethod.CASH,
    discount_amount: Decimal = Decimal("0.00"),
    tax_amount: Decimal = Decimal("0.00"),
    cashier_id: Optional[int] = None,
    notes: Optional[str] = None
) -> FranchiseSale:
    invoice_num = generate_sale_invoice_number()
    subtotal = Decimal("0.00")

    sale = FranchiseSale(
        invoice_number=invoice_num,
        location_id=location_id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        subtotal=Decimal("0.00"),
        discount_amount=discount_amount,
        tax_amount=tax_amount,
        total_amount=Decimal("0.00"),
        payment_method=payment_method,
        sale_date=datetime.utcnow(),
        cashier_id=cashier_id,
        notes=notes
    )
    db.add(sale)
    db.flush()

    for item in items_data:
        p_id = item["product_id"]
        qty = Decimal(str(item["quantity"]))
        unit_price = Decimal(str(item["unit_price"]))
        batch_id = item.get("batch_id")
        line_total = qty * unit_price
        subtotal += line_total

        sale_item = FranchiseSaleItem(
            sale_id=sale.id,
            product_id=p_id,
            batch_id=batch_id,
            quantity=qty,
            unit_price=unit_price,
            total_price=line_total
        )
        db.add(sale_item)

        # Deduct inventory immediately from branch stock
        update_stock(
            db=db,
            location_id=location_id,
            product_id=p_id,
            quantity_delta=-qty,
            movement_type=MovementType.RETAIL_SALE,
            reference_type="FRANCHISE_SALE",
            reference_id=invoice_num,
            batch_id=batch_id,
            notes=f"Retail sale invoice {invoice_num}",
            user_id=cashier_id
        )

    sale.subtotal = subtotal
    sale.total_amount = subtotal - discount_amount + tax_amount
    db.commit()
    db.refresh(sale)
    return sale
