import os
import sys

# Ensure backend directory is in the Python search path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app

# Vercel Serverless Function entry point
# Exports 'app' for the ASGI/FastAPI handler
