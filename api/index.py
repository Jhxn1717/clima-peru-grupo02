import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, '..', 'backend'))
root_dir = os.path.abspath(os.path.join(current_dir, '..'))

for p in [current_dir, backend_dir, root_dir]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

from app.main import app  # type: ignore # pyright: ignore # noqa: E402
from mangum import Mangum  # type: ignore # pyright: ignore # noqa: E402

handler = Mangum(app, lifespan="off")
