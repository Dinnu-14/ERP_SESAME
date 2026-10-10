from decimal import Decimal
from fastapi.testclient import TestClient

def test_b2b_wholesale_order_dispatch_and_payment(client: TestClient, seeded_entities: dict):
    admin_hdr = seeded_entities["admin_headers"]
    factory_hdr = seeded_entities["factory_headers"]
    loc_factory_id = seeded_entities["loc_factory"].id

    # 1. Create B2B Customer
    cust_res = client.post(
        "/api/v1/b2b/customers",
        headers=admin_hdr,
        json={
            "customer_code": "CUST-TEST-001",
            "company_name": "Apex Sweets & Confectionery",
            "contact_name": "Naveen",
            "email": "naveen@apexsweets.com",
            "phone": "9900112233",
            "credit_limit": 500000.0,
            "payment_terms_days": 30
        }
    )
    assert cust_res.status_code == 200, cust_res.text
    customer_id = cust_res.json()["id"]

    # 2. Create Product & Batch at Factory
    prod_res = client.post(
        "/api/v1/inventory/products",
        headers=admin_hdr,
        json={
            "name": "B2B Bulk 15L Sesame Oil Tin",
            "code": "B2B-OIL-15L-TIN",
            "sku": "SKU-B2B-15L-01",
            "product_type": "FINISHED_GOOD",
            "uom": "TIN_15L",
            "default_price": 5400.0,
            "cost_price": 4200.0
        }
    )
    product_id = prod_res.json()["id"]

    batch_res = client.post(
        "/api/v1/inventory/batches",
        headers=factory_hdr,
        json={
            "batch_number": "BAT-B2B-TIN-100",
            "product_id": product_id,
            "location_id": loc_factory_id,
            "initial_quantity": 20.0,
            "cost_per_unit": 4200.0
        }
    )
    batch_id = batch_res.json()["id"]

    # 3. Create Wholesale Sales Order for 10 Tins
    so_res = client.post(
        "/api/v1/b2b/orders",
        headers=admin_hdr,
        json={
            "customer_id": customer_id,
            "location_id": loc_factory_id,
            "notes": "Diwali bulk order delivery",
            "items": [
                {
                    "product_id": product_id,
                    "batch_id": batch_id,
                    "quantity": 10.0,
                    "unit_price": 5400.0,
                    "tax_percent": 5.0
                }
            ]
        }
    )
    assert so_res.status_code == 200, so_res.text
    so_data = so_res.json()
    order_id = so_data["id"]
    assert float(so_data["subtotal"]) == 54000.0
    assert float(so_data["tax_amount"]) == 2700.0
    assert float(so_data["total_amount"]) == 56700.0

    # 4. Dispatch Sales Order
    disp_res = client.post(
        f"/api/v1/b2b/orders/{order_id}/dispatch",
        headers=admin_hdr
    )
    assert disp_res.status_code == 200, disp_res.text
    assert disp_res.json()["status"] == "DISPATCHED"

    # Verify inventory was deducted from 20 to 10
    bal_res = client.get(
        f"/api/v1/inventory/balances?location_id={loc_factory_id}&product_id={product_id}",
        headers=factory_hdr
    )
    assert float(bal_res.json()[0]["quantity"]) == 10.0

    # 5. Verify Invoice generated and record partial payment
    inv_list_res = client.get("/api/v1/b2b/invoices", headers=admin_hdr)
    invoices = inv_list_res.json()
    target_inv = [inv for inv in invoices if inv["sales_order_id"] == order_id][0]
    invoice_id = target_inv["id"]
    assert float(target_inv["total_amount"]) == 56700.0

    pay_res = client.post(
        f"/api/v1/b2b/invoices/{invoice_id}/payments",
        headers=admin_hdr,
        json={
            "amount": 30000.0,
            "payment_method": "RTGS",
            "reference_number": "UTR1234567890",
            "notes": "Advance 50%+ payment"
        }
    )
    assert pay_res.status_code == 200, pay_res.text
    assert float(pay_res.json()["amount"]) == 30000.0

def test_unauthorized_location_access_blocked(client: TestClient, seeded_entities: dict):
    franchise_hdr = seeded_entities["franchise_headers"] # user location_id = SUFALA branch (e.g. 2)
    loc_factory_id = seeded_entities["loc_factory"].id # location_id = Factory (e.g. 1)

    # Franchise manager tries to record an extraction at Factory Plant -> Should be 403 Forbidden!
    ext_res = client.post(
        "/api/v1/franchise/extractions",
        headers=franchise_hdr,
        json={
            "location_id": loc_factory_id,
            "ownership": "COMPANY_OWNED",
            "seed_product_id": 1,
            "seed_input_qty": 50.0,
            "oil_output_qty": 23.0,
            "cake_output_qty": 25.0
        }
    )
    assert ext_res.status_code == 403
    assert "Access denied" in ext_res.text
