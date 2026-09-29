import sqlite3

from backend.agent.graph.nodes.executor import execute_sql


def _approved_state(sql, intent="write", **updates):
    state = {
        "generated_sql": sql,
        "validated_sql": sql,
        "human_decision": "approved",
        "intent": intent,
        "risk_flags": [],
        "workflow_status": "approved",
    }
    state.update(updates)
    return state


def _status(database_path, order_id):
    connection = sqlite3.connect(database_path)
    try:
        return connection.execute(
            "SELECT status FROM orders WHERE id = ?", (order_id,)
        ).fetchone()[0]
    finally:
        connection.close()


def test_approved_select_returns_rows(sandbox_db):
    result = execute_sql(
        _approved_state("SELECT id, status FROM orders WHERE id = 1", intent="read")
    )

    assert result["execution_result"]["success"] is True
    assert result["execution_result"]["rows"] == [{"id": 1, "status": "pending"}]


def test_approved_update_commits(sandbox_db):
    result = execute_sql(
        _approved_state("UPDATE orders SET status = 'shipped' WHERE id = 1")
    )

    assert result["execution_result"]["rows_affected"] == 1
    assert _status(sandbox_db, 1) == "shipped"


def test_update_returning_is_committed_as_a_write(sandbox_db):
    result = execute_sql(
        _approved_state(
            "UPDATE orders SET status = 'shipped' WHERE id = 1 RETURNING id, status"
        )
    )

    assert result["execution_result"]["type"] == "write"
    assert result["execution_result"]["rows_affected"] == 1
    assert result["execution_result"]["rows"] == [{"id": 1, "status": "shipped"}]
    assert _status(sandbox_db, 1) == "shipped"


def test_unapproved_rejected_or_risky_sql_never_executes(sandbox_db):
    sql = "UPDATE orders SET status = 'shipped' WHERE id = 1"
    for state in (
        _approved_state(sql, human_decision=None),
        _approved_state(sql, human_decision="rejected"),
        _approved_state(sql, risk_flags=["test_risk"]),
        _approved_state(sql, validated_sql="different SQL"),
    ):
        result = execute_sql(state)
        assert result["execution_result"]["success"] is False

    assert _status(sandbox_db, 1) == "pending"


def test_failed_write_rolls_back(sandbox_db):
    connection = sqlite3.connect(sandbox_db)
    connection.execute(
        """
        CREATE TRIGGER reject_order_update
        BEFORE UPDATE ON orders
        BEGIN
            SELECT RAISE(ABORT, 'test failure');
        END;
        """
    )
    connection.commit()
    connection.close()

    result = execute_sql(
        _approved_state("UPDATE orders SET status = 'shipped' WHERE id = 1")
    )

    assert result["execution_result"]["success"] is False
    assert result["workflow_status"] == "execution_failed"
    assert _status(sandbox_db, 1) == "pending"