import sys
import os

# Add backend directory to sys.path for Vercel Serverless Function runtime
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.main import app
