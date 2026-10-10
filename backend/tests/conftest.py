import os
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.config import settings
from app.models.location import Organization, Location, LocationType
from app.models.user import User, UserRole
from app.models.inventory import ProductCategory, Product, Batch, ProductType, UnitOfMeasure
from app.services.auth_service import hash_password, create_access_token

# Use isolated in-memory or file-based test db
TEST_DATABASE_URL = "sqlite:///./test_erp.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_erp.db"):
        try:
            os.remove("./test_erp.db")
        except Exception:
            pass

@pytest.fixture
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def seeded_entities(db_session):
    org = Organization(name="Test Sesame Agro", code="TEST-AGRO")
    db_session.add(org)
    db_session.flush()

    loc_factory = Location(
        organization_id=org.id, name="Test Factory Plant", code="TEST-FAC",
        location_type=LocationType.FACTORY
    )
    loc_sufala = Location(
        organization_id=org.id, name="Test SUFALA Franchise", code="TEST-SUFALA",
        location_type=LocationType.FRANCHISE_BRANCH
    )
    db_session.add_all([loc_factory, loc_sufala])
    db_session.flush()

    pw = hash_password("password123")
    admin_user = User(
        email="admin@test.com", hashed_password=pw, full_name="Admin Tester",
        role=UserRole.SUPER_ADMIN, organization_id=org.id
    )
    factory_user = User(
        email="factory@test.com", hashed_password=pw, full_name="Factory Tester",
        role=UserRole.FACTORY_MANAGER, organization_id=org.id, location_id=loc_factory.id
    )
    franchise_user = User(
        email="franchise@test.com", hashed_password=pw, full_name="Franchise Tester",
        role=UserRole.FRANCHISE_MANAGER, organization_id=org.id, location_id=loc_sufala.id
    )
    db_session.add_all([admin_user, factory_user, franchise_user])
    db_session.flush()

    admin_token = create_access_token({"sub": str(admin_user.id), "role": admin_user.role.value})
    factory_token = create_access_token({"sub": str(factory_user.id), "role": factory_user.role.value})
    franchise_token = create_access_token({"sub": str(franchise_user.id), "role": franchise_user.role.value})

    return {
        "org": org,
        "loc_factory": loc_factory,
        "loc_sufala": loc_sufala,
        "admin_user": admin_user,
        "factory_user": factory_user,
        "franchise_user": franchise_user,
        "admin_headers": {"Authorization": f"Bearer {admin_token}"},
        "factory_headers": {"Authorization": f"Bearer {factory_token}"},
        "franchise_headers": {"Authorization": f"Bearer {franchise_token}"}
    }
