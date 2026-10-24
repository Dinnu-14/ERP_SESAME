import os
import sys

# Ensure backend root is in the Python search path
backend_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app

# Vercel Serverless Function entry point
