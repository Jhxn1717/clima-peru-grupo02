import sys
import os
import shutil
import traceback

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, '..', 'backend'))
root_dir = os.path.abspath(os.path.join(current_dir, '..'))

for p in [current_dir, backend_dir, root_dir]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

# Setup DB in /tmp
if os.getenv("VERCEL") == "1" or (os.path.exists("/tmp") and os.name != "nt"):
    tmp_db = "/tmp/clima_peru.db"
    if not os.path.exists(tmp_db) or os.path.getsize(tmp_db) == 0:
        for candidate in [
            os.path.join(current_dir, "clima_peru.db"),
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

def handler(environ, start_response):
    try:
        from app.main import app
        from a2wsgi import ASGIMiddleware
        wsgi_app = ASGIMiddleware(app)
        return wsgi_app(environ, start_response)
    except Exception as exc:
        err_msg = f"ERROR: {exc}\n\nTRACEBACK:\n{traceback.format_exc()}".encode("utf-8")
        start_response("200 OK", [
            ("Content-Type", "text/plain; charset=utf-8"),
            ("Content-Length", str(len(err_msg)))
        ])
        return [err_msg]
