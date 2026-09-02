import sys
import os
import shutil
import traceback

# Ensure all candidate paths are in sys.path for Vercel Serverless Function runtime
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, '..', 'backend'))
root_dir = os.path.abspath(os.path.join(current_dir, '..'))

for p in [backend_dir, current_dir, root_dir, os.getcwd()]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

# On Vercel / Serverless, ensure SQLite database is copied to writable /tmp with write permissions
if os.getenv("VERCEL") == "1" or (os.path.exists("/tmp") and os.name != "nt"):
    tmp_db = "/tmp/clima_peru.db"
    if not os.path.exists(tmp_db):
        for candidate in [
            os.path.join(backend_dir, "clima_peru.db"),
            os.path.join(root_dir, "clima_peru.db"),
            os.path.join(current_dir, "clima_peru.db"),
        ]:
            if os.path.exists(candidate):
                try:
                    shutil.copyfile(candidate, tmp_db)
                    os.chmod(tmp_db, 0o666)
                    break
                except Exception as e:
                    print(f"Notice: could not copy db to /tmp: {e}")

try:
    from app.main import app  # type: ignore # pyright: ignore # noqa: E402
    from app.seed.seed_data import init_db_and_seed  # type: ignore # pyright: ignore # noqa: E402

    try:
        init_db_and_seed()
    except Exception as e:
        print(f"Notice: init_db_and_seed on serverless: {e}")

    handler = app

except Exception as err:
    err_tb = traceback.format_exc()
    print(f"CRITICAL ERROR loading FastAPI app: {err_tb}")
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="Clima Perú Diagnostic")

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
    def catch_all(full_path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Server initialization error",
                "message": str(err),
                "traceback": err_tb,
                "sys_path": sys.path,
                "cwd": os.getcwd()
            }
        )

    handler = app
