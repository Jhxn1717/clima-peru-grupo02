import sys
import os
import shutil

# Ensure backend directory is in sys.path for Vercel Serverless Function runtime
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# On Vercel / Serverless, ensure SQLite database is copied to writable /tmp
if os.getenv("VERCEL") == "1" or (os.path.exists("/tmp") and os.name != "nt"):
    tmp_db = "/tmp/clima_peru.db"
    if not os.path.exists(tmp_db):
        for candidate in [
            os.path.join(backend_dir, "clima_peru.db"),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "clima_peru.db"))
        ]:
            if os.path.exists(candidate):
                try:
                    shutil.copy2(candidate, tmp_db)
                    break
                except Exception as e:
                    print(f"Notice: could not copy db to /tmp: {e}")

try:
    from app.main import app  # type: ignore # pyright: ignore # noqa: E402
    from app.seed.seed_data import init_db_and_seed  # type: ignore # pyright: ignore # noqa: E402
    init_db_and_seed()
except Exception as e:
    import traceback
    err_msg = traceback.format_exc()
    print(f"Serverless startup exception: {err_msg}")
    from fastapi import FastAPI  # type: ignore # pyright: ignore # noqa: E402
    from fastapi.responses import JSONResponse  # type: ignore # pyright: ignore # noqa: E402
    app = FastAPI()
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE"])
    async def error_fallback(path_name: str):
        return JSONResponse(status_code=500, content={"error": "Startup error", "details": str(e), "traceback": err_msg})
