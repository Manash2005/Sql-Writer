import sqlparse

from backend.agent.graph.state import AgentState
from backend.database.connection import get_connection


def validate_sql_safety(sql: str) -> list[str]:
    """
    Perform deterministic safety checks on generated SQL.
    """

    risk_flags = []

    statements = sqlparse.parse(sql)

    if not statements:
        risk_flags.append("empty_sql")
        return risk_flags

    statement = statements[0]
    statement_type = statement.get_type()

    # Schema changes are not allowed in v1
    if statement_type in {"CREATE", "ALTER", "DROP"}:
        risk_flags.append("schema_change_not_allowed")

    # UPDATE and DELETE must contain WHERE
    if statement_type in {"UPDATE", "DELETE"}:
        if "WHERE" not in sql.upper():
            risk_flags.append("missing_where_clause")

    return risk_flags


def estimate_rows_affected(sql: str) -> int | None:
    """
    Estimate how many rows an UPDATE or DELETE would affect.

    Uses SQLite's EXPLAIN QUERY PLAN indirectly by transforming the
    operation into a SELECT COUNT(*) query.
    """

    statements = sqlparse.parse(sql)

    if not statements:
        return None

    statement_type = statements[0].get_type()

    if statement_type not in {"UPDATE", "DELETE"}:
        return None

    sql_upper = sql.upper()

    if "WHERE" not in sql_upper:
        return None

    # Find WHERE clause
    where_index = sql_upper.find("WHERE")

    where_clause = sql[where_index:]

    if statement_type == "DELETE":
        table_name = sql.split()[2]

    else:
        # UPDATE table_name SET ...
        table_name = sql.split()[1]

    count_sql = f"""
        SELECT COUNT(*)
        FROM {table_name}
        {where_clause}
    """

    connection = get_connection()

    try:
        result = connection.execute(count_sql).fetchone()
        return result[0]
    finally:
        connection.close()


def validate_sql(state: AgentState) -> dict:
    """
    Validate generated SQL and estimate affected rows.
    """

    sql = state["generated_sql"]

    if not sql:
        return {
            "risk_flags": ["empty_sql"],
            "estimated_rows_affected": None,
        }

    risk_flags = validate_sql_safety(sql)

    estimated_rows = None

    # Only estimate if basic safety checks passed
    if not risk_flags:
        estimated_rows = estimate_rows_affected(sql)

    return {
        "risk_flags": risk_flags,
        "estimated_rows_affected": estimated_rows,
    }