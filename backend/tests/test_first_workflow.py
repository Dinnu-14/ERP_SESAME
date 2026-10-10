from decimal import Decimal
from fastapi.testclient import TestClient

def test_first_action_complete_workflow(client: TestClient, seeded_entities: dict):
    admin_hdr = seeded_entities["admin_headers"]
    factory_hdr = seeded_entities["factory_headers"]
    franchise_hdr = seeded_entities["franchise_headers"]
    loc_factory_id = seeded_entities["loc_factory"].id
    loc_sufala_id = seeded_entities["loc_sufala"].id

    # 1. Create Product Category
    cat_res = client.post(
        "/api/v1/inventory/categories",
        headers=admin_hdr,
        json={"name": "Cold-Pressed Sesame Oils", "code": "CAT-TEST-OIL", "description": "Tested Category"}
    )
    assert cat_res.status_code == 200, cat_res.text
    category_id = cat_res.json()["id"]

    # 2. Create Product
    prod_res = client.post(
        "/api/v1/inventory/products",
        headers=admin_hdr,
        json={
            "category_id": category_id,
            "name": "Standard Cold-Pressed Sesame Oil 1L",
            "code": "PROD-SESAME-1L-TEST",
            "sku": "SKU-SESAME-1L-TEST",
            "product_type": "FINISHED_GOOD",
            "uom": "BOTTLE_1L",
            "default_price": 400.0,
            "cost_price": 300.0,
            "reorder_level": 50.0
        }
    )
    assert prod_res.status_code == 200, prod_res.text
    product_id = prod_res.json()["id"]

    # 3. Receive Factory Stock (create batch at factory with 500 units)
    batch_res = client.post(
        "/api/v1/inventory/batches",
        headers=factory_hdr,
        json={
            "batch_number": "BAT-TEST-FACTORY-001",
            "product_id": product_id,
            "location_id": loc_factory_id,
            "initial_quantity": 500.0,
            "cost_per_unit": 300.0,
            "notes": "Initial factory stock"
        }
    )
    assert batch_res.status_code == 200, batch_res.text
    batch_id = batch_res.json()["id"]

    # Verify initial balance at factory
    bal_res_initial = client.get(
        f"/api/v1/inventory/balances?location_id={loc_factory_id}&product_id={product_id}",
        headers=factory_hdr
    )
    assert bal_res_initial.status_code == 200
    assert float(bal_res_initial.json()[0]["quantity"]) == 500.0

    # 4. SUFALA Franchise creates transfer request for 100 units
    trf_create_res = client.post(
        "/api/v1/transfers",
        headers=franchise_hdr,
        json={
            "source_location_id": loc_factory_id,
            "destination_location_id": loc_sufala_id,
            "notes": "Replenishment for SUFALA store retail sales",
            "items": [
                {
                    "product_id": product_id,
                    "batch_id": batch_id,
                    "requested_quantity": 100.0
                }
            ]
        }
    )
    assert trf_create_res.status_code == 200, trf_create_res.text
    transfer_data = trf_create_res.json()
    transfer_id = transfer_data["id"]
    transfer_item_id = transfer_data["items"][0]["id"]
    assert transfer_data["status"] == "REQUESTED"

    # 5. Factory approves transfer
    appr_res = client.post(
        f"/api/v1/transfers/{transfer_id}/approve",
        headers=factory_hdr
    )
    assert appr_res.status_code == 200
    assert appr_res.json()["status"] == "APPROVED"

    # 6. Factory dispatches 100 units to SUFALA
    disp_res = client.post(
        f"/api/v1/transfers/{transfer_id}/dispatch",
        headers=factory_hdr,
        json={
            "items": [
                {
                    "item_id": transfer_item_id,
                    "batch_id": batch_id,
                    "dispatched_quantity": 100.0
                }
            ],
            "notes": "Dispatched via logistics van KA-01-EA-9999"
        }
    )
    assert disp_res.status_code == 200, disp_res.text
    assert disp_res.json()["status"] == "DISPATCHED"

    # Verify factory balance is reduced from 500 to 400
    bal_factory_after_disp = client.get(
        f"/api/v1/inventory/balances?location_id={loc_factory_id}&product_id={product_id}",
        headers=factory_hdr
    )
    assert float(bal_factory_after_disp.json()[0]["quantity"]) == 400.0

    # Verify SUFALA balance is still 0 before confirmation
    bal_sufala_before_rec = client.get(
        f"/api/v1/inventory/balances?location_id={loc_sufala_id}&product_id={product_id}",
        headers=franchise_hdr
    )
    assert len(bal_sufala_before_rec.json()) == 0

    # 7. SUFALA confirms receipt (receives 98 good, 2 damaged in transit)
    rec_res = client.post(
        f"/api/v1/transfers/{transfer_id}/receive",
        headers=franchise_hdr,
        json={
            "items": [
                {
                    "item_id": transfer_item_id,
                    "received_quantity": 98.0,
                    "damaged_quantity": 2.0,
                    "notes": "2 bottles had broken seals upon unloading"
                }
            ],
            "notes": "Verified by branch manager"
        }
    )
    assert rec_res.status_code == 200, rec_res.text
    assert rec_res.json()["status"] == "COMPLETED"

    # 8. Verify destination stock balance increased to 98
    bal_sufala_after_rec = client.get(
        f"/api/v1/inventory/balances?location_id={loc_sufala_id}&product_id={product_id}",
        headers=franchise_hdr
    )
    assert len(bal_sufala_after_rec.json()) == 1
    assert float(bal_sufala_after_rec.json()[0]["quantity"]) == 98.0

    # 9. Verify movements ledger has both DISPATCH and RECEIVE movements
    mov_res = client.get("/api/v1/inventory/movements", headers=admin_hdr)
    assert mov_res.status_code == 200
    movements = mov_res.json()
    mov_types = [m["movement_type"] for m in movements]
    assert "TRANSFER_DISPATCH" in mov_types
    assert "TRANSFER_RECEIVE" in mov_types
