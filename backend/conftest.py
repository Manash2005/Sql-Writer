import sqlite3

import pytest


@pytest.fixture
def sandbox_db(monkeypatch, tmp_path):
    import backend.database.connection as database_connection

    database_path = tmp_path / "sandbox.db"
    monkeypatch.setattr(database_connection, "DB_PATH", database_path)
    connection = sqlite3.connect(database_path)
    connection.execute(
        "CREATE TABLE orders (id INTEGER PRIMARY KEY, status TEXT NOT NULL)"
    )
    connection.executemany(
        "INSERT INTO orders (id, status) VALUES (?, ?)",
        [(1, "pending"), (2, "cancelled"), (3, "shipped")],
    )
    connection.commit()
    connection.close()
    return database_path