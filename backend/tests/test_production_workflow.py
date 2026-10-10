from decimal import Decimal
from fastapi.testclient import TestClient

def test_production_and_oil_extraction(client: TestClient, seeded_entities: dict):
    admin_hdr = seeded_entities["admin_headers"]
    factory_hdr = seeded_entities["factory_headers"]
    loc_factory_id = seeded_entities["loc_factory"].id

    # 1. Create Raw Seed Product
    seed_res = client.post(
        "/api/v1/inventory/products",
        headers=admin_hdr,
        json={
            "name": "Test Raw Sesame Seeds",
            "code": "PROD-RAW-SEED-TEST",
            "sku": "SKU-RAW-SEED-TEST",
            "product_type": "RAW_MATERIAL",
            "uom": "KG",
            "default_price": 160.0,
            "cost_price": 140.0
        }
    )
    assert seed_res.status_code == 200
    seed_product_id = seed_res.json()["id"]

    # 2. Create Oil Product & Cake Product
    oil_res = client.post(
        "/api/v1/inventory/products",
        headers=admin_hdr,
        json={
            "name": "Test Sesame Oil Bulk",
            "code": "PROD-OIL-BULK-TEST",
            "sku": "SKU-OIL-BULK-TEST",
            "product_type": "INTERMEDIATE",
            "uom": "LITER",
            "default_price": 380.0,
            "cost_price": 300.0
        }
    )
    oil_product_id = oil_res.json()["id"]

    cake_res = client.post(
        "/api/v1/inventory/products",
        headers=admin_hdr,
        json={
            "name": "Test Sesame Cake Pinac",
            "code": "PROD-CAKE-TEST",
            "sku": "SKU-CAKE-TEST",
            "product_type": "BY_PRODUCT",
            "uom": "KG",
            "default_price": 40.0,
            "cost_price": 30.0
        }
    )
    cake_product_id = cake_res.json()["id"]

    # 3. Add Raw Seed Stock at Factory (1000 KG)
    seed_batch_res = client.post(
        "/api/v1/inventory/batches",
        headers=factory_hdr,
        json={
            "batch_number": "BAT-SEED-LOT-100",
            "product_id": seed_product_id,
            "location_id": loc_factory_id,
            "initial_quantity": 1000.0,
            "cost_per_unit": 140.0
        }
    )
    seed_batch_id = seed_batch_res.json()["id"]

    # 4. Start Production Batch (consume 1000 KG seed)
    start_res = client.post(
        "/api/v1/production/batches",
        headers=factory_hdr,
        json={
            "location_id": loc_factory_id,
            "seed_product_id": seed_product_id,
            "seed_batch_id": seed_batch_id,
            "seed_input_qty": 1000.0,
            "oil_product_id": oil_product_id,
            "cake_product_id": cake_product_id,
            "expected_oil_yield_pct": 46.0,
            "notes": "Testing expeller extraction"
        }
    )
    assert start_res.status_code == 200, start_res.text
    prod_batch = start_res.json()
    prod_batch_id = prod_batch["id"]
    assert prod_batch["status"] == "IN_PROGRESS"

    # Verify seed inventory at factory is reduced to 0
    seed_bal_after_issue = client.get(
        f"/api/v1/inventory/balances?location_id={loc_factory_id}&product_id={seed_product_id}",
        headers=factory_hdr
    )
    assert float(seed_bal_after_issue.json()[0]["quantity"]) == 0.0

    # 5. Complete Production Batch
    # Input: 1000 KG
    # Oil output: 460 L (46% yield)
    # Cake output: 520 KG
    # Recorded loss: 10 KG
    # Variance: 1000 - (460 + 520 + 10) = 10 KG
    complete_res = client.post(
        f"/api/v1/production/batches/{prod_batch_id}/complete",
        headers=factory_hdr,
        json={
            "oil_output_qty": 460.0,
            "cake_output_qty": 520.0,
            "recorded_loss_qty": 10.0,
            "quality_check": {
                "free_fatty_acids_pct": 0.75,
                "moisture_pct": 0.12,
                "color": "Clear Golden",
                "odor": "Characteristic nutty aroma",
                "density_g_ml": 0.920,
                "status": "PASSED"
            },
            "notes": "Optimal press cycle achieved"
        }
    )
    assert complete_res.status_code == 200, complete_res.text
    completed_batch = complete_res.json()
    assert completed_batch["status"] == "COMPLETED"
    assert float(completed_batch["actual_oil_yield_pct"]) == 46.0
    assert float(completed_batch["unexplained_variance_qty"]) == 10.0

    # 6. Verify Oil output is credited in inventory
    oil_bal = client.get(
        f"/api/v1/inventory/balances?location_id={loc_factory_id}&product_id={oil_product_id}",
        headers=factory_hdr
    )
    assert float(oil_bal.json()[0]["quantity"]) == 460.0

    # 7. Verify Cake by-product is credited in inventory
    cake_bal = client.get(
        f"/api/v1/inventory/balances?location_id={loc_factory_id}&product_id={cake_product_id}",
        headers=factory_hdr
    )
    assert float(cake_bal.json()[0]["quantity"]) == 520.0
