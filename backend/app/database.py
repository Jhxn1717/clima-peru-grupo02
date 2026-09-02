import os
import shutil
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# SQLite connection args for threading support
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# Ensure /tmp SQLite database exists on Serverless
if is_sqlite and "/tmp/" in settings.DATABASE_URL:
    tmp_db = "/tmp/clima_peru.db"
    if not os.path.exists(tmp_db) or os.path.getsize(tmp_db) == 0:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        for candidate in [
            os.path.join(base_dir, "..", "clima_peru.db"),
            os.path.join(base_dir, "..", "..", "clima_peru.db"),
            os.path.join(os.getcwd(), "clima_peru.db"),
        ]:
            if os.path.exists(candidate) and os.path.getsize(candidate) > 0:
                try:
                    shutil.copyfile(candidate, tmp_db)
                    os.chmod(tmp_db, 0o666)
                    break
                except Exception:
                    pass

connect_args = {"check_same_thread": False} if is_sqlite else {}
engine_kwargs = {"connect_args": connect_args, "echo": False}
if not is_sqlite:
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
