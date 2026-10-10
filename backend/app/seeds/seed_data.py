import os
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from app.database import SessionLocal, Base, engine
from app.models.location import Organization, Location, LocationType
from app.models.user import User, Employee, Attendance, UserRole
from app.models.inventory import (
    ProductCategory, Product, Batch, StockBalance, StockMovement,
    UnitOfMeasure, ProductType, MovementType
)
from app.models.procurement import Supplier, PurchaseOrder, PurchaseOrderItem, POStatus
from app.models.b2b import B2BCustomer, B2BSalesOrder, B2BSalesOrderItem, B2BOrderStatus
from app.models.sop import SOP, SOPVersion, SOPChecklistStep, SOPCategory, SOPStatus
from app.models.audit import Notification, NotificationType
from app.services.auth_service import hash_password
from app.services.inventory_service import update_stock

def seed_database():
    # Ensure tables are created first
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Organization).first():
            print("Database already has data. Skipping seed.")
            return

        print("Seeding database...")

        # 1. Organization
        org = Organization(
            name="Sesame Agro Industries & SUFALA Network",
            code="SESAME-SUFALA-CORP",
            description="Integrated sesame processing factory and franchise retail network"
        )
        db.add(org)
        db.flush()

        # 2. Locations
        loc_factory = Location(
            organization_id=org.id,
            name="Central Sesame Processing Plant",
            code="FAC-CENTRAL",
            location_type=LocationType.FACTORY,
            address="Plot 42-45, Industrial Agro Park, KIADB",
            city="Davanagere",
            state="Karnataka",
            pincode="577002",
            contact_number="+91-8192-234567",
            manager_name="Rajesh Sharma"
        )
        loc_factory_wh = Location(
            organization_id=org.id,
            name="Factory Central Goods Warehouse",
            code="WH-CENTRAL",
            location_type=LocationType.WAREHOUSE,
            address="Plot 46, Industrial Agro Park, KIADB",
            city="Davanagere",
            state="Karnataka",
            pincode="577002",
            contact_number="+91-8192-234568",
            manager_name="Mohan Kumar"
        )
        loc_sufala_blr = Location(
            organization_id=org.id,
            name="SUFALA Franchise - Bangalore South (Jayanagar)",
            code="SUFALA-BLR-01",
            location_type=LocationType.FRANCHISE_BRANCH,
            address="9th Main, 4th Block, Jayanagar",
            city="Bengaluru",
            state="Karnataka",
            pincode="560011",
            contact_number="+91-80-26543210",
            manager_name="Suresh Gowda"
        )
        loc_sufala_mys = Location(
            organization_id=org.id,
            name="SUFALA Franchise - Mysore City (Gokulam)",
            code="SUFALA-MYS-01",
            location_type=LocationType.FRANCHISE_BRANCH,
            address="15th Cross, 3rd Stage, Gokulam",
            city="Mysuru",
            state="Karnataka",
            pincode="570002",
            contact_number="+91-821-2512345",
            manager_name="Pooja Rao"
        )
        db.add_all([loc_factory, loc_factory_wh, loc_sufala_blr, loc_sufala_mys])
        db.flush()

        # 3. Users
        pw_admin = hash_password("admin123")
        pw_default = hash_password("sesame123")

        u_admin = User(email="admin@sesame-erp.com", hashed_password=pw_admin, full_name="Sanjay Hegde (Owner)", role=UserRole.SUPER_ADMIN, organization_id=org.id)
        u_fact_mgr = User(email="factory.mgr@sesame-erp.com", hashed_password=pw_default, full_name="Rajesh Sharma", role=UserRole.FACTORY_MANAGER, organization_id=org.id, location_id=loc_factory.id)
        u_prod_mgr = User(email="production.mgr@sesame-erp.com", hashed_password=pw_default, full_name="Anand Kulkarni", role=UserRole.PRODUCTION_MANAGER, organization_id=org.id, location_id=loc_factory.id)
        u_store_mgr = User(email="store.mgr@sesame-erp.com", hashed_password=pw_default, full_name="Mohan Kumar", role=UserRole.STORE_MANAGER, organization_id=org.id, location_id=loc_factory_wh.id)
        u_sufala_blr = User(email="sufala.blr@sesame-erp.com", hashed_password=pw_default, full_name="Suresh Gowda", role=UserRole.FRANCHISE_MANAGER, organization_id=org.id, location_id=loc_sufala_blr.id)
        u_sufala_mys = User(email="sufala.mys@sesame-erp.com", hashed_password=pw_default, full_name="Pooja Rao", role=UserRole.FRANCHISE_MANAGER, organization_id=org.id, location_id=loc_sufala_mys.id)
        u_b2b_mgr = User(email="b2b.mgr@sesame-erp.com", hashed_password=pw_default, full_name="Vikram Patil", role=UserRole.B2B_SALES_MANAGER, organization_id=org.id, location_id=loc_factory.id)
        u_quality_mgr = User(email="quality.mgr@sesame-erp.com", hashed_password=pw_default, full_name="Dr. Sneha Varma", role=UserRole.QUALITY_MANAGER, organization_id=org.id, location_id=loc_factory.id)
        u_hr_mgr = User(email="hr.mgr@sesame-erp.com", hashed_password=pw_default, full_name="Geetha Nambiar", role=UserRole.HR_MANAGER, organization_id=org.id, location_id=loc_factory.id)
        u_auditor = User(email="auditor@sesame-erp.com", hashed_password=pw_default, full_name="CA Ramesh Narang", role=UserRole.AUDITOR, organization_id=org.id)

        db.add_all([u_admin, u_fact_mgr, u_prod_mgr, u_store_mgr, u_sufala_blr, u_sufala_mys, u_b2b_mgr, u_quality_mgr, u_hr_mgr, u_auditor])
        db.flush()

        # 4. Product Categories
        cat_raw = ProductCategory(name="Raw Sesame Seeds", code="CAT-RAW-SEED", description="Natural unrefined raw sesame seeds for cold-press extraction")
        cat_cpo = ProductCategory(name="Cold-Pressed Oils", code="CAT-CPO", description="Virgin cold-pressed and wood-pressed sesame oils")
        cat_by = ProductCategory(name="Extraction By-Products", code="CAT-BYPROD", description="Sesame oil cake (pinac) and hulls")
        cat_pkg = ProductCategory(name="Packaging Materials", code="CAT-PKG", description="Food-grade bottles, caps, and outer cartons")
        db.add_all([cat_raw, cat_cpo, cat_by, cat_pkg])
        db.flush()

        # 5. Products
        p_white_seed = Product(
            category_id=cat_raw.id, name="White Sesame Seeds (Grade A Premium)", code="RAW-SESAME-WHT", sku="SKU-RSW-001",
            product_type=ProductType.RAW_MATERIAL, uom=UnitOfMeasure.KG, default_price=Decimal("180.00"), cost_price=Decimal("150.00"),
            reorder_level=Decimal("500.00"), description="High oil-content white sesame seeds sorted and cleaned"
        )
        p_black_seed = Product(
            category_id=cat_raw.id, name="Black Sesame Seeds (Nutritional Grade)", code="RAW-SESAME-BLK", sku="SKU-RSB-002",
            product_type=ProductType.RAW_MATERIAL, uom=UnitOfMeasure.KG, default_price=Decimal("210.00"), cost_price=Decimal("175.00"),
            reorder_level=Decimal("300.00"), description="Black sesame rich in calcium and antioxidants"
        )
        p_oil_1l = Product(
            category_id=cat_cpo.id, name="Pure Cold-Pressed Sesame Oil (1 Litre Glass Bottle)", code="OIL-SESAME-1L", sku="SKU-OIL-1L-01",
            product_type=ProductType.FINISHED_GOOD, uom=UnitOfMeasure.BOTTLE_1L, default_price=Decimal("420.00"), cost_price=Decimal("310.00"),
            reorder_level=Decimal("100.00"), description="Unrefined extra virgin cold-pressed sesame oil, 1 Litre"
        )
        p_oil_500ml = Product(
            category_id=cat_cpo.id, name="Pure Cold-Pressed Sesame Oil (500ml Glass Bottle)", code="OIL-SESAME-500M", sku="SKU-OIL-500M-02",
            product_type=ProductType.FINISHED_GOOD, uom=UnitOfMeasure.BOTTLE_500ML, default_price=Decimal("225.00"), cost_price=Decimal("165.00"),
            reorder_level=Decimal("150.00"), description="Traditional wood-pressed sesame oil, 500ml"
        )
        p_bulk_oil = Product(
            category_id=cat_cpo.id, name="Bulk Filtered Sesame Oil (Raw/Intermediate)", code="OIL-SESAME-BULK", sku="SKU-OIL-BLK-03",
            product_type=ProductType.INTERMEDIATE, uom=UnitOfMeasure.LITER, default_price=Decimal("360.00"), cost_price=Decimal("290.00"),
            reorder_level=Decimal("200.00"), description="Freshly pressed sesame oil in intermediate storage tanks"
        )
        p_cake = Product(
            category_id=cat_by.id, name="Sesame Oil Cake / Pinac (High Protein)", code="BYP-SESAME-CAKE", sku="SKU-CAKE-001",
            product_type=ProductType.BY_PRODUCT, uom=UnitOfMeasure.KG, default_price=Decimal("45.00"), cost_price=Decimal("32.00"),
            reorder_level=Decimal("200.00"), description="Nutritious sesame cake by-product for cattle feed and organic farming"
        )
        p_pkg_bottle = Product(
            category_id=cat_pkg.id, name="1-Litre Amber Glass Bottles with Caps", code="PKG-BOTTLE-1L", sku="SKU-PKG-B1L",
            product_type=ProductType.PACKAGING, uom=UnitOfMeasure.PIECE, default_price=Decimal("32.00"), cost_price=Decimal("24.00"),
            reorder_level=Decimal("500.00"), description="UV-protecting amber glass bottles for oil packaging"
        )
        db.add_all([p_white_seed, p_black_seed, p_oil_1l, p_oil_500ml, p_bulk_oil, p_cake, p_pkg_bottle])
        db.flush()

        # 6. Batches and Initial Inventory
        b_white = Batch(
            batch_number="BAT-RAW-WHT-2026-001", product_id=p_white_seed.id, location_id=loc_factory.id,
            initial_quantity=Decimal("5000.0000"), current_quantity=Decimal("5000.0000"), cost_per_unit=Decimal("150.00"),
            notes="Opening batch received from Davanagere Mandi"
        )
        b_black = Batch(
            batch_number="BAT-RAW-BLK-2026-001", product_id=p_black_seed.id, location_id=loc_factory.id,
            initial_quantity=Decimal("2500.0000"), current_quantity=Decimal("2500.0000"), cost_per_unit=Decimal("175.00"),
            notes="Opening black sesame lot from Bellary"
        )
        b_oil_1l_fac = Batch(
            batch_number="BAT-OIL-1L-2026-001", product_id=p_oil_1l.id, location_id=loc_factory_wh.id,
            initial_quantity=Decimal("600.0000"), current_quantity=Decimal("600.0000"), cost_per_unit=Decimal("310.00"),
            notes="Cold-pressed production batch ready for dispatch"
        )
        b_cake_fac = Batch(
            batch_number="BAT-CAKE-2026-001", product_id=p_cake.id, location_id=loc_factory_wh.id,
            initial_quantity=Decimal("3200.0000"), current_quantity=Decimal("3200.0000"), cost_per_unit=Decimal("32.00"),
            notes="Stored in dry bag section"
        )
        db.add_all([b_white, b_black, b_oil_1l_fac, b_cake_fac])
        db.flush()

        # Initialize stock balances and movements
        update_stock(db, loc_factory.id, p_white_seed.id, Decimal("5000.0000"), MovementType.OPENING_STOCK, "OPENING", b_white.batch_number, b_white.id, Decimal("150.00"), user_id=u_admin.id)
        update_stock(db, loc_factory.id, p_black_seed.id, Decimal("2500.0000"), MovementType.OPENING_STOCK, "OPENING", b_black.batch_number, b_black.id, Decimal("175.00"), user_id=u_admin.id)
        update_stock(db, loc_factory_wh.id, p_oil_1l.id, Decimal("600.0000"), MovementType.OPENING_STOCK, "OPENING", b_oil_1l_fac.batch_number, b_oil_1l_fac.id, Decimal("310.00"), user_id=u_admin.id)
        update_stock(db, loc_factory_wh.id, p_cake.id, Decimal("3200.0000"), MovementType.OPENING_STOCK, "OPENING", b_cake_fac.batch_number, b_cake_fac.id, Decimal("32.00"), user_id=u_admin.id)

        # SUFALA Bangalore branch initial stock
        b_sufala_oil = Batch(
            batch_number="BAT-SUF-BLR-OIL-01", product_id=p_oil_1l.id, location_id=loc_sufala_blr.id,
            initial_quantity=Decimal("80.0000"), current_quantity=Decimal("80.0000"), cost_per_unit=Decimal("310.00"),
            notes="Initial franchise shelf stock"
        )
        b_sufala_seed = Batch(
            batch_number="BAT-SUF-BLR-SEED-01", product_id=p_white_seed.id, location_id=loc_sufala_blr.id,
            initial_quantity=Decimal("300.0000"), current_quantity=Decimal("300.0000"), cost_per_unit=Decimal("150.00"),
            notes="Raw seeds for live customer extraction"
        )
        db.add_all([b_sufala_oil, b_sufala_seed])
        db.flush()

        update_stock(db, loc_sufala_blr.id, p_oil_1l.id, Decimal("80.0000"), MovementType.OPENING_STOCK, "OPENING", b_sufala_oil.batch_number, b_sufala_oil.id, Decimal("310.00"), user_id=u_admin.id)
        update_stock(db, loc_sufala_blr.id, p_white_seed.id, Decimal("300.0000"), MovementType.OPENING_STOCK, "OPENING", b_sufala_seed.batch_number, b_sufala_seed.id, Decimal("150.00"), user_id=u_admin.id)

        # 7. Suppliers
        sup1 = Supplier(name="Kaveri Agro Seed Producers Co-Op", code="SUP-KAV-01", contact_person="Ranganath", email="kaveri.seeds@gmail.com", phone="+91-9448123456", address="Haveri APMC Yard", gst_tin="29AAACK1234A1Z5")
        sup2 = Supplier(name="Deccan Organic Farmers FPO", code="SUP-DEC-02", contact_person="Venkatesh", email="deccan.fpo@gmail.com", phone="+91-9880654321", address="Raichur Agri Hub", gst_tin="29BBBDF5678B1Z2")
        db.add_all([sup1, sup2])

        # 8. B2B Customers
        cust1 = B2BCustomer(customer_code="CUST-KRISHNA-01", company_name="Sri Krishna Sweets & Snacks Ltd", contact_name="Muralidhar", email="orders@srikrishna.com", phone="+91-80-23456789", address="Peenya Industrial Area", city="Bengaluru", gst_tin="29AAACS9988C1Z4", credit_limit=Decimal("500000.00"))
        cust2 = B2BCustomer(customer_code="CUST-HERITAGE-02", company_name="Heritage Organic Marts", contact_name="Lalitha Devi", email="purchase@heritageorganic.in", phone="+91-821-2334455", address="VV Mohalla", city="Mysuru", gst_tin="29BBBDH7766D1Z1", credit_limit=Decimal("250000.00"))
        db.add_all([cust1, cust2])

        # 9. Employees
        emp1 = Employee(user_id=u_prod_mgr.id, employee_code="EMP-101", first_name="Anand", last_name="Kulkarni", department="Production", job_title="Production Superintendent", location_id=loc_factory.id)
        emp2 = Employee(user_id=u_store_mgr.id, employee_code="EMP-102", first_name="Mohan", last_name="Kumar", department="Store & Warehouse", job_title="Warehouse Lead", location_id=loc_factory_wh.id)
        emp3 = Employee(user_id=u_sufala_blr.id, employee_code="EMP-201", first_name="Suresh", last_name="Gowda", department="SUFALA Franchise", job_title="Franchise Store Manager", location_id=loc_sufala_blr.id)
        emp4 = Employee(user_id=u_sufala_mys.id, employee_code="EMP-202", first_name="Pooja", last_name="Rao", department="SUFALA Franchise", job_title="Franchise Store Manager", location_id=loc_sufala_mys.id)
        db.add_all([emp1, emp2, emp3, emp4])
        db.flush()

        # Attendances
        for emp in [emp1, emp2, emp3, emp4]:
            att = Attendance(employee_id=emp.id, date=datetime.utcnow(), status="PRESENT", check_in="08:45 AM", check_out="06:00 PM", notes="On time")
            db.add(att)

        # 10. Standard Operating Procedures (SOP)
        sop1 = SOP(
            code="SOP-PROD-001", title="Cold-Press Sesame Oil Extraction Protocol",
            category=SOPCategory.OIL_EXTRACTION, department="Production",
            description="Standard operating procedure for wood and steel cold-press expellers"
        )
        db.add(sop1)
        db.flush()

        ver1 = SOPVersion(
            sop_id=sop1.id, version_number="v1.0",
            content="""# Standard Operating Procedure: Cold-Press Sesame Oil Extraction
1. **Raw Seed Pre-check**: Inspect seed batch for moisture content (< 6.5%).
2. **Cold Press Temperature**: Maintain expeller barrel below 48°C to prevent thermal degradation of vitamins and antioxidants.
3. **Yield Verification**: Target oil yield is 45-48% by weight. Pinac oil cake target is 50-52%.
4. **Residue Cleaning**: Flush extraction chamber after every 8-hour shift.""",
            change_summary="Initial operational release",
            status=SOPStatus.PUBLISHED,
            effective_date=datetime.utcnow(),
            approved_by_id=u_admin.id,
            approved_at=datetime.utcnow()
        )
        db.add(ver1)
        db.flush()

        s1 = SOPChecklistStep(version_id=ver1.id, step_number=1, title="Moisture Inspection", instruction="Verify moisture is between 5.5% - 6.5% before feeding", is_critical=True)
        s2 = SOPChecklistStep(version_id=ver1.id, step_number=2, title="Temperature Sensor Check", instruction="Ensure infrared sensor calibrated to 48°C threshold", is_critical=True)
        s3 = SOPChecklistStep(version_id=ver1.id, step_number=3, title="Mass-balance reconciliation", instruction="Log input seed KG and weighed oil/cake output into ERP immediately", is_critical=False)
        db.add_all([s1, s2, s3])

        # Notifications
        notif1 = Notification(
            title="ERP System Initialized",
            message="Sesame Factory & SUFALA Integrated ERP is live with synchronized inventory and operational ledger.",
            notification_type=NotificationType.SUCCESS
        )
        notif2 = Notification(
            title="SUFALA Franchise Connected",
            message="Bangalore South and Mysore branches are linked to central plant replenishment.",
            notification_type=NotificationType.INFO
        )
        db.add_all([notif1, notif2])

        db.commit()
        print("Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
