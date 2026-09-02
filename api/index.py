import sys
import os
import shutil
import traceback

try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.abspath(os.path.join(current_dir, '..', 'backend'))
    root_dir = os.path.abspath(os.path.join(current_dir, '..'))

    for p in [current_dir, backend_dir, root_dir]:
        if os.path.exists(p) and p not in sys.path:
            sys.path.insert(0, p)

    if os.getenv("VERCEL") == "1" or (os.path.exists("/tmp") and os.name != "nt"):
        tmp_db = "/tmp/clima_peru.db"
        if not os.path.exists(tmp_db) or os.path.getsize(tmp_db) == 0:
            for candidate in [
                os.path.join(current_dir, "clima_peru.db"),
                os.path.join(current_dir, "..", "clima_peru.db"),
                os.path.join(backend_dir, "clima_peru.db"),
                os.path.join(root_dir, "clima_peru.db"),
            ]:
                if os.path.exists(candidate) and os.path.getsize(candidate) > 0:
                    try:
                        shutil.copyfile(candidate, tmp_db)
                        os.chmod(tmp_db, 0o666)
                        break
                    except Exception:
                        pass
        if os.path.exists(tmp_db):
            try:
                os.chmod(tmp_db, 0o666)
            except Exception:
                pass

    from app.main import app

except Exception as exc:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="Error Diagnostic")
    err_str = f"STARTUP ERROR: {exc}\n{traceback.format_exc()}"

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    def catch_all(full_path: str):
        return JSONResponse(status_code=500, content={"error": err_str})
