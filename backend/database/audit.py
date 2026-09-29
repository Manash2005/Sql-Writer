import json
from datetime import datetime

from backend.database.connection import get_connection


def create_audit_table():
    connection = get_connection()

    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                thread_id TEXT NOT NULL,
                user_request TEXT NOT NULL,
                intent TEXT,
                generated_sql TEXT,
                risk_flags TEXT,
                estimated_rows_affected INTEGER,
                human_decision TEXT,
                execution_result TEXT,
                created_at TEXT NOT NULL
            );
            """
        )

        connection.commit()

    finally:
        connection.close()


def log_audit_event(
    thread_id: str,
    user_request: str,
    intent: str,
    generated_sql: str | None,
    risk_flags: list[str],
    estimated_rows_affected: int | None,
    human_decision: str | None,
    execution_result: dict | None,
):
    connection = get_connection()

    try:
        existing = connection.execute(
            "SELECT id, human_decision, execution_result, generated_sql FROM audit_logs WHERE thread_id = ?",
            (thread_id,)
        ).fetchone()

        if existing:
            final_decision = human_decision or existing["human_decision"]
            final_exec = json.dumps(execution_result) if execution_result is not None else existing["execution_result"]
            final_sql = generated_sql or existing["generated_sql"]
            connection.execute(
                """
                UPDATE audit_logs
                SET user_request = ?,
                    intent = ?,
                    generated_sql = ?,
                    risk_flags = ?,
                    estimated_rows_affected = COALESCE(?, estimated_rows_affected),
                    human_decision = ?,
                    execution_result = ?
                WHERE thread_id = ?
                """,
                (
                    user_request,
                    intent,
                    final_sql,
                    json.dumps(risk_flags),
                    estimated_rows_affected,
                    final_decision,
                    final_exec,
                    thread_id,
                ),
            )
        else:
            connection.execute(
                """
                INSERT INTO audit_logs (
                    thread_id,
                    user_request,
                    intent,
                    generated_sql,
                    risk_flags,
                    estimated_rows_affected,
                    human_decision,
                    execution_result,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    thread_id,
                    user_request,
                    intent,
                    generated_sql,
                    json.dumps(risk_flags),
                    estimated_rows_affected,
                    human_decision,
                    json.dumps(execution_result),
                    datetime.now().isoformat(),
                ),
            )

        connection.commit()

    finally:
        connection.close()


def clear_audit_logs():
    connection = get_connection()
    try:
        connection.execute("DELETE FROM audit_logs")
        connection.commit()
    finally:
        connection.close()