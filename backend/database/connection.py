import sqlite3
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DB_PATH = PROJECT_ROOT / "data" / "app.db"

def get_connection() -> sqlite3.Connection :
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    return connection