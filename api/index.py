import sys
import os
import shutil

# Ensure current directory and candidate paths are in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, '..', 'backend'))
root_dir = os.path.abspath(os.path.join(current_dir, '..'))

for p in [current_dir, backend_dir, root_dir]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

# On Vercel / Serverless, ensure SQLite database is copied to writable /tmp with write permissions
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
                except Exception as e:
                    print(f"Notice: could not copy db to /tmp: {e}")
    if os.path.exists(tmp_db):
        try:
            os.chmod(tmp_db, 0o666)
        except Exception:
            pass

from app.main import app  # type: ignore # pyright: ignore # noqa: E402
