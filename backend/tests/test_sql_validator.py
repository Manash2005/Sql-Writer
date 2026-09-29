from backend.agent.graph.nodes.validator import (
    estimate_rows_affected,
    validate_sql,
    validate_sql_safety,
)


def test_accepts_supported_scoped_sql(sandbox_db):
    assert validate_sql_safety("SELECT * FROM orders WHERE id = 1") == []
    assert validate_sql_safety("UPDATE orders SET status = 'shipped' WHERE id = 1") == []
    assert validate_sql_safety("DELETE FROM orders WHERE id = 2") == []


def test_blocks_unscoped_modifications_and_full_table_changes(sandbox_db):
    assert "missing_where_clause" in validate_sql_safety(
        "UPDATE orders SET status = 'shipped'"
    )
    assert "missing_where_clause" in validate_sql_safety("DELETE FROM orders")
    assert "unrestricted_modification" in validate_sql_safety(
        "UPDATE orders SET status = 'shipped' WHERE 1 = 1"
    )


def test_blocks_schema_changes_and_unknown_statement_types(sandbox_db):
    assert "schema_change_not_allowed" in validate_sql_safety("CREATE TABLE x (id INT)")
    assert "schema_change_not_allowed" in validate_sql_safety("ALTER TABLE orders ADD x INT")
    assert "schema_change_not_allowed" in validate_sql_safety("DROP TABLE orders")
    assert "unsupported_statement_type" in validate_sql_safety("PRAGMA user_version = 1")
    assert "unsupported_statement_type" in validate_sql_safety(
        'ATTACH DATABASE "external.db" AS external'
    )


def test_blocks_empty_malformed_multiple_and_unknown_schema_references(sandbox_db):
    assert "empty_sql" in validate_sql_safety("  ")
    assert "invalid_sql_or_schema_reference" in validate_sql_safety("SELECT FROM orders")
    assert "multiple_statements" in validate_sql_safety(
        "SELECT 1; DELETE FROM orders WHERE id = 1"
    )
    assert "invalid_sql_or_schema_reference" in validate_sql_safety(
        "SELECT missing_column FROM orders"
    )
    assert "invalid_sql_or_schema_reference" in validate_sql_safety(
        "SELECT * FROM missing_table"
    )


def test_statement_type_must_match_intent(sandbox_db):
    assert "intent_statement_mismatch" in validate_sql_safety(
        "UPDATE orders SET status = 'shipped' WHERE id = 1",
        intent="read",
    )
    assert "intent_statement_mismatch" in validate_sql_safety(
        "SELECT * FROM orders",
        intent="write",
    )


def test_row_estimates_use_real_sandbox_data(sandbox_db):
    assert estimate_rows_affected("UPDATE orders SET status = 'shipped' WHERE status = 'pending'") == 1
    assert estimate_rows_affected("DELETE FROM orders WHERE id = 2") == 1
    assert estimate_rows_affected("SELECT * FROM orders") is None
    assert estimate_rows_affected("DELETE FROM orders") is None
    assert estimate_rows_affected("UPDATE orders SET status = 'x' WHERE 1 = 1") is None


def test_schema_change_intent_is_blocked(sandbox_db):
    result = validate_sql(
        {
            "intent": "schema_change",
            "generated_sql": "DROP TABLE orders",
        }
    )

    assert result["risk_flags"] == ["schema_change_not_allowed"]
    assert result["validated_sql"] is None