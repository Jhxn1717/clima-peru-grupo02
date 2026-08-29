import sys
import os
import shutil

# Add backend directory to sys.path for Vercel Serverless Function runtime
backend_dir = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_dir)

# On Vercel / Serverless, ensure SQLite database is copied to writable /tmp
if os.getenv("VERCEL") == "1" or (os.path.exists("/tmp") and os.name != "nt"):
    tmp_db = "/tmp/clima_peru.db"
    if not os.path.exists(tmp_db):
        for candidate in [
            os.path.join(backend_dir, "clima_peru.db"),
            os.path.join(os.path.dirname(__file__), "..", "clima_peru.db")
        ]:
            if os.path.exists(candidate):
                try:
                    shutil.copy2(candidate, tmp_db)
                    break
                except Exception as e:
                    print(f"Notice: could not copy db to /tmp: {e}")

from app.main import app

