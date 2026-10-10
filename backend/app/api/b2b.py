from typing import List, Optional
from decimal import Decimal
from datetime import datetime, timedelta
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.b2b import (
    B2BCustomer, B2BSalesOrder, B2BSalesOrderItem, B2BInvoice, B2BPayment,
    B2BOrderStatus, InvoiceStatus
)
from app.models.inventory import MovementType
from app.models.user import User, UserRole
from app.schemas.b2b import (
    B2BCustomerCreate, B2BCustomerOut,
    B2BSalesOrderCreate, B2BSalesOrderOut,
    B2BInvoiceOut, B2BPaymentCreate, B2BPaymentOut
)
from app.services.inventory_service import update_stock
from app.api.deps import get_current_user

router = APIRouter(prefix="/b2b", tags=["B2B Wholesale Management"])

# --- Customers ---
@router.get("/customers", response_model=List[B2BCustomerOut])
def list_customers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(B2BCustomer).filter(B2BCustomer.is_active == True).all()

@router.post("/customers", response_model=B2BCustomerOut)
def create_customer(
    cust_in: B2BCustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cust = B2BCustomer(**cust_in.model_dump())
    db.add(cust)
    db.commit()
    db.refresh(cust)
    return cust

# --- Sales Orders ---
@router.get("/orders", response_model=List[B2BSalesOrderOut])
def list_sales_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(B2BSalesOrder).order_by(B2BSalesOrder.created_at.desc()).all()

@router.post("/orders", response_model=B2BSalesOrderOut)
def create_sales_order(
    so_in: B2BSalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    so_number = f"SO-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{uuid.uuid4().hex[:4].upper()}"
    subtotal = Decimal("0.00")
    tax_total = Decimal("0.00")

    so = B2BSalesOrder(
        so_number=so_number,
        customer_id=so_in.customer_id,
        location_id=so_in.location_id,
        delivery_due_date=so_in.delivery_due_date,
        status=B2BOrderStatus.CONFIRMED,
        notes=so_in.notes,
        created_by_id=current_user.id
    )
    db.add(so)
    db.flush()

    for item in so_in.items:
        line_sub = item.quantity * item.unit_price
        line_tax = line_sub * (item.tax_percent / 100)
        line_total = line_sub + line_tax
        subtotal += line_sub
        tax_total += line_tax

        so_item = B2BSalesOrderItem(
            sales_order_id=so.id,
            product_id=item.product_id,
            batch_id=item.batch_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            tax_percent=item.tax_percent,
            total_price=line_total
        )
        db.add(so_item)

    so.subtotal = subtotal
    so.tax_amount = tax_total
    so.total_amount = subtotal + tax_total
    db.commit()
    db.refresh(so)
    return so

@router.post("/orders/{order_id}/dispatch", response_model=B2BSalesOrderOut)
def dispatch_sales_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    so = db.query(B2BSalesOrder).filter(B2BSalesOrder.id == order_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Sales order not found")
    if so.status not in [B2BOrderStatus.CONFIRMED, B2BOrderStatus.APPROVED, B2BOrderStatus.RESERVED]:
        raise HTTPException(status_code=400, detail=f"Cannot dispatch order in status {so.status}")

    # Deduct stock for each item from location
    for item in so.items:
        update_stock(
            db=db,
            location_id=so.location_id,
            product_id=item.product_id,
            quantity_delta=-item.quantity,
            movement_type=MovementType.B2B_DISPATCH,
            reference_type="B2B_SALES_ORDER",
            reference_id=so.so_number,
            batch_id=item.batch_id,
            unit_cost=item.unit_price,
            notes=f"Dispatched for wholesale customer ID {so.customer_id}",
            user_id=current_user.id
        )

    # Generate Invoice
    inv_num = f"INV-B2B-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{uuid.uuid4().hex[:4].upper()}"
    invoice = B2BInvoice(
        invoice_number=inv_num,
        sales_order_id=so.id,
        customer_id=so.customer_id,
        invoice_date=datetime.utcnow(),
        due_date=datetime.utcnow() + timedelta(days=30),
        total_amount=so.total_amount,
        paid_amount=Decimal("0.00"),
        status=InvoiceStatus.UNPAID
    )
    db.add(invoice)

    so.status = B2BOrderStatus.DISPATCHED
    db.commit()
    db.refresh(so)
    return so

# --- Invoices and Payments ---
@router.get("/invoices", response_model=List[B2BInvoiceOut])
def list_invoices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(B2BInvoice).order_by(B2BInvoice.invoice_date.desc()).all()

@router.post("/invoices/{invoice_id}/payments", response_model=B2BPaymentOut)
def record_payment(
    invoice_id: int,
    pay_in: B2BPaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(B2BInvoice).filter(B2BInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    pay_num = f"PAY-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{uuid.uuid4().hex[:4].upper()}"
    payment = B2BPayment(
        payment_number=pay_num,
        invoice_id=invoice.id,
        amount=pay_in.amount,
        payment_date=datetime.utcnow(),
        payment_method=pay_in.payment_method,
        reference_number=pay_in.reference_number,
        notes=pay_in.notes,
        received_by_id=current_user.id
    )
    db.add(payment)

    new_paid = invoice.paid_amount + pay_in.amount
    invoice.paid_amount = new_paid
    if new_paid >= invoice.total_amount:
        invoice.status = InvoiceStatus.PAID
    else:
        invoice.status = InvoiceStatus.PARTIALLY_PAID

    db.commit()
    db.refresh(payment)
    return payment
