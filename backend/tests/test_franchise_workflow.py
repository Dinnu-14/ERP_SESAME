from decimal import Decimal
from fastapi.testclient import TestClient

def test_franchise_operations_and_sales(client: TestClient, seeded_entities: dict):
    admin_hdr = seeded_entities["admin_headers"]
    franchise_hdr = seeded_entities["franchise_headers"]
    loc_sufala_id = seeded_entities["loc_sufala"].id

    # 1. Create Retail Product & Stock at SUFALA
    prod_res = client.post(
        "/api/v1/inventory/products",
        headers=admin_hdr,
        json={
            "name": "SUFALA 500ml Cold-Pressed Sesame Bottle",
            "code": "SUF-OIL-500ML",
            "sku": "SKU-SUF-500ML",
            "product_type": "FINISHED_GOOD",
            "uom": "BOTTLE_500ML",
            "default_price": 220.0,
            "cost_price": 160.0
        }
    )
    product_id = prod_res.json()["id"]

    # Initial stock of 50 bottles at SUFALA branch
    client.post(
        "/api/v1/inventory/batches",
        headers=admin_hdr,
        json={
            "batch_number": "BAT-SUFALA-TEST-50",
            "product_id": product_id,
            "location_id": loc_sufala_id,
            "initial_quantity": 50.0,
            "cost_per_unit": 160.0
        }
    )

    # 2. Process B: Record Retail Sale (Sell 5 bottles)
    sale_res = client.post(
        "/api/v1/franchise/sales",
        headers=franchise_hdr,
        json={
            "location_id": loc_sufala_id,
            "customer_name": "Ravi Kumar",
            "customer_phone": "9876543210",
            "payment_method": "UPI",
            "items": [
                {
                    "product_id": product_id,
                    "quantity": 5.0,
                    "unit_price": 220.0
                }
            ],
            "notes": "Store counter sale"
        }
    )
    assert sale_res.status_code == 200, sale_res.text
    sale_data = sale_res.json()
    assert float(sale_data["total_amount"]) == 1100.0

    # Verify inventory was deducted from 50 to 45
    bal_res = client.get(
        f"/api/v1/inventory/balances?location_id={loc_sufala_id}&product_id={product_id}",
        headers=franchise_hdr
    )
    assert float(bal_res.json()[0]["quantity"]) == 45.0

    # 3. Process A: Customer-owned Seed Extraction Service
    ext_res = client.post(
        "/api/v1/franchise/extractions",
        headers=franchise_hdr,
        json={
            "location_id": loc_sufala_id,
            "ownership": "CUSTOMER_OWNED",
            "customer_name": "Farmer Basavaraj",
            "customer_phone": "9945112233",
            "service_charge": 150.0,
            "is_service_paid": True,
            "seed_product_id": product_id,
            "seed_input_qty": 20.0,
            "oil_output_qty": 9.2,
            "cake_output_qty": 10.4,
            "waste_qty": 0.4,
            "notes": "Custom extraction for client seeds"
        }
    )
    assert ext_res.status_code == 200, ext_res.text
    ext_data = ext_res.json()
    assert ext_data["ownership"] == "CUSTOMER_OWNED"
    assert float(ext_data["service_charge"]) == 150.0

    # Verify that company inventory of product is NOT changed by customer extraction
    bal_res_after_ext = client.get(
        f"/api/v1/inventory/balances?location_id={loc_sufala_id}&product_id={product_id}",
        headers=franchise_hdr
    )
    assert float(bal_res_after_ext.json()[0]["quantity"]) == 45.0
