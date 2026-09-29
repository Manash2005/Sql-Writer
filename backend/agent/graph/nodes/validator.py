import sqlite3

import sqlparse
from sqlparse.sql import Statement, Where

from backend.agent.graph.state import AgentState
from backend.database.connection import get_connection

SUPPORTED_STATEMENT_TYPES = {"SELECT", "INSERT", "UPDATE", "DELETE"}
SCHEMA_CHANGE_TYPES = {"CREATE", "ALTER", "DROP"}
DANGEROUS_FUNCTIONS = {"load_extension", "readfile", "writefile"}


def _single_statement(
    sql: str,
    intent: str | None = None,
) -> tuple[Statement | None, list[str]]:
    if not sql or not sql.strip():
        return None, ["empty_sql"]

    statements = [statement for statement in sqlparse.parse(sql) if str(statement).strip()]
    if len(statements) != 1:
        return None, ["multiple_statements"]

    statement = statements[0]
    statement_type = statement.get_type()
    if statement_type in SCHEMA_CHANGE_TYPES:
        return statement, ["schema_change_not_allowed"]
    if statement_type not in SUPPORTED_STATEMENT_TYPES:
        return statement, ["unsupported_statement_type"]
    if intent == "read" and statement_type != "SELECT":
        return statement, ["intent_statement_mismatch"]
    if intent == "write" and statement_type not in {"INSERT", "UPDATE", "DELETE"}:
        return statement, ["intent_statement_mismatch"]
    if intent not in {None, "read", "write", "schema_change"}:
        return statement, ["unsupported_intent"]
    if statement_type in {"UPDATE", "DELETE"} and not any(
        isinstance(token, Where) for token in statement.tokens
    ):
        return statement, ["missing_where_clause"]

    return statement, []


def _compile_statement(
    connection: sqlite3.Connection,
    sql: str,
) -> tuple[list[str], str | None]:
    statement, risk_flags = _single_statement(sql)
    if risk_flags or statement is None:
        return risk_flags, None

    statement_type = statement.get_type()
    modified_tables: list[str] = []
    compile_risk: list[str] = []

    def authorize(action, first, second, database, source):
        if action in {sqlite3.SQLITE_ATTACH, sqlite3.SQLITE_DETACH, sqlite3.SQLITE_PRAGMA}:
            compile_risk.append("unsupported_sql_construct")
            return sqlite3.SQLITE_DENY

        if database not in {None, "main"}:
            compile_risk.append("external_database_access")
            return sqlite3.SQLITE_DENY

        if action == sqlite3.SQLITE_FUNCTION and (second or first or "").lower() in DANGEROUS_FUNCTIONS:
            compile_risk.append("dangerous_function")
            return sqlite3.SQLITE_DENY

        if action in {sqlite3.SQLITE_READ, sqlite3.SQLITE_INSERT, sqlite3.SQLITE_UPDATE, sqlite3.SQLITE_DELETE}:
            table_name = first or ""
            if table_name.lower().startswith("sqlite_"):
                compile_risk.append("system_table_access")
                return sqlite3.SQLITE_DENY

        if source is None and action in {sqlite3.SQLITE_INSERT, sqlite3.SQLITE_UPDATE, sqlite3.SQLITE_DELETE}:
            modified_tables.append(first)

        return sqlite3.SQLITE_OK

    connection.set_authorizer(authorize)
    try:
        connection.execute(f"EXPLAIN {sql}").fetchall()
    except sqlite3.Error:
        if not compile_risk:
            compile_risk.append("invalid_sql_or_schema_reference")
    finally:
        connection.set_authorizer(None)

    if compile_risk:
        return list(dict.fromkeys(compile_risk)), None

    target_table = modified_tables[0] if statement_type in {"UPDATE", "DELETE"} and modified_tables else None
    if statement_type in {"UPDATE", "DELETE"} and target_table is None:
        return ["unable_to_determine_target_table"], None

    return [], target_table


def _where_clause(statement: Statement) -> str | None:
    where = next((token for token in statement.tokens if isinstance(token, Where)), None)
    return str(where) if where is not None else None


def _estimate_on_connection(
    connection: sqlite3.Connection,
    statement: Statement,
    target_table: str,
) -> tuple[int | None, list[str]]:
    where_clause = _where_clause(statement)
    if where_clause is None:
        return None, ["missing_where_clause"]

    quoted_table = '"' + target_table.replace('"', '""') + '"'

    def estimation_authorizer(action, first, second, database, source):
        function_name = (second or first or "").lower()
        if action in {sqlite3.SQLITE_ATTACH, sqlite3.SQLITE_DETACH, sqlite3.SQLITE_PRAGMA}:
            return sqlite3.SQLITE_DENY
        if database not in {None, "main"}:
            return sqlite3.SQLITE_DENY
        if action == sqlite3.SQLITE_FUNCTION and function_name in DANGEROUS_FUNCTIONS:
            return sqlite3.SQLITE_DENY
        return sqlite3.SQLITE_OK

    try:
        connection.set_authorizer(estimation_authorizer)
        affected = connection.execute(
            f"SELECT COUNT(*) FROM {quoted_table} {where_clause}"
        ).fetchone()[0]
        connection.set_authorizer(None)
        total = connection.execute(
            f"SELECT COUNT(*) FROM {quoted_table}"
        ).fetchone()[0]
    except sqlite3.Error:
        return None, ["row_estimation_failed"]
    finally:
        connection.set_authorizer(None)

    flags = ["unrestricted_modification"] if affected > 0 and affected == total else []
    return affected, flags


def _validate_and_estimate(
    sql: str,
    connection: sqlite3.Connection,
    intent: str | None = None,
) -> tuple[list[str], int | None, str | None]:
    if intent == "schema_change":
        return ["schema_change_not_allowed"], None, None

    statement, initial_flags = _single_statement(sql, intent)
    if initial_flags or statement is None:
        return initial_flags, None, None

    risk_flags, target_table = _compile_statement(connection, sql)
    if risk_flags:
        return risk_flags, None, None

    if statement.get_type() not in {"UPDATE", "DELETE"}:
        return [], None, sql

    estimated_rows, estimate_flags = _estimate_on_connection(
        connection,
        statement,
        target_table,
    )
    return estimate_flags, estimated_rows, sql if not estimate_flags else None


def validate_sql_safety(sql: str, intent: str | None = None) -> list[str]:
    connection = get_connection()
    try:
        risk_flags, _, _ = _validate_and_estimate(sql, connection, intent)
        return risk_flags
    finally:
        connection.close()


def estimate_rows_affected(sql: str) -> int | None:
    connection = get_connection()
    try:
        risk_flags, estimated_rows, _ = _validate_and_estimate(sql, connection)
        return None if risk_flags else estimated_rows
    finally:
        connection.close()


def validate_sql(state: AgentState) -> dict:
    if state.get("intent") == "schema_change":
        return {
            "risk_flags": ["schema_change_not_allowed"],
            "estimated_rows_affected": None,
            "validated_sql": None,
            "workflow_status": "blocked",
        }

    sql = state.get("generated_sql")
    if not sql:
        return {
            "risk_flags": ["empty_sql"],
            "estimated_rows_affected": None,
            "validated_sql": None,
            "workflow_status": "blocked",
        }

    connection = get_connection()
    try:
        risk_flags, estimated_rows, validated_sql = _validate_and_estimate(
            sql,
            connection,
            state.get("intent"),
        )
    finally:
        connection.close()

    return {
        "risk_flags": risk_flags,
        "estimated_rows_affected": estimated_rows,
        "validated_sql": validated_sql,
        "workflow_status": "blocked" if risk_flags else "awaiting_approval",
    }