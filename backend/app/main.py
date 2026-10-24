from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
import app.models  # Ensures all models are registered with Base.metadata

# Import API routers
from app.api.auth import router as auth_router
from app.api.locations import router as locations_router
from app.api.inventory import router as inventory_router
from app.api.transfers import router as transfers_router
from app.api.procurement import router as procurement_router
from app.api.production import router as production_router
from app.api.franchise import router as franchise_router
from app.api.b2b import router as b2b_router
from app.api.wastage import router as wastage_router
from app.api.employees import router as employees_router
from app.api.sops import router as sops_router
from app.api.reports import router as reports_router
from app.api.audit import router as audit_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Centralized ERP Web Application for Sesame Distribution Factory & SUFALA Franchise Business",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health & Root Check
@app.get("/", tags=["System"])
def root(request: Request):
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        return RedirectResponse(url="/docs")
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_url": "/health",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": "1.0.0"
    }

@app.get("/api", include_in_schema=False)
@app.get(settings.API_V1_STR, include_in_schema=False)
def api_root():
    return {
        "app": settings.PROJECT_NAME,
        "api_version": "v1",
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    }

# Include API v1 routers
prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=prefix)
app.include_router(locations_router, prefix=prefix)
app.include_router(inventory_router, prefix=prefix)
app.include_router(transfers_router, prefix=prefix)
app.include_router(procurement_router, prefix=prefix)
app.include_router(production_router, prefix=prefix)
app.include_router(franchise_router, prefix=prefix)
app.include_router(b2b_router, prefix=prefix)
app.include_router(wastage_router, prefix=prefix)
app.include_router(employees_router, prefix=prefix)
app.include_router(sops_router, prefix=prefix)
app.include_router(reports_router, prefix=prefix)
app.include_router(audit_router, prefix=prefix)
