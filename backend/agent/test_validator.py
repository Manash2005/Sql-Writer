from backend.agent.graph.nodes.validator import (
    estimate_rows_affected,
    validate_sql_safety,
)


def test_delete_where_inside_comment_is_rejected(sandbox_db):
    sql = "DELETE FROM orders -- WHERE 1=1\n"

    assert "missing_where_clause" in validate_sql_safety(sql)
    assert estimate_rows_affected(sql) is None


def test_unsupported_sql_statements_are_rejected(sandbox_db):
    assert "unsupported_statement_type" in validate_sql_safety(
        "PRAGMA user_version = 1"
    )
    assert "unsupported_statement_type" in validate_sql_safety(
        'ATTACH DATABASE "other.db" AS other'
    )