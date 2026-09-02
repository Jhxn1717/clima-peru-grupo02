import sys
import os
from fastapi import FastAPI

app = FastAPI()

@app.get("/api/health")
@app.get("/health")
def health():
    return {"status": "ok", "message": "FastAPI is running on Vercel!"}

@app.get("/api/diag")
@app.get("/diag")
def diag():
    diagnostics = {}
    diagnostics["python_version"] = sys.version
    diagnostics["cwd"] = os.getcwd()
    diagnostics["sys_path"] = sys.path
    
    # Test dependencies
    deps = ["fastapi", "pydantic", "sqlalchemy", "httpx", "bcrypt", "jwt", "dotenv"]
    for dep in deps:
        try:
            __import__(dep)
            diagnostics[f"import_{dep}"] = "OK"
        except Exception as e:
            diagnostics[f"import_{dep}"] = f"FAILED: {e}"

    # Test importing app.main
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        if current_dir not in sys.path:
            sys.path.insert(0, current_dir)
        from app.main import app as main_app
        diagnostics["import_app_main"] = "OK"
    except Exception as e:
        import traceback
        diagnostics["import_app_main"] = f"FAILED: {e}\n{traceback.format_exc()}"

    return diagnostics
