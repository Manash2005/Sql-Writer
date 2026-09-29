import importlib
import sqlite3

import pytest
from fastapi.testclient import TestClient


def _fake_intent(state):
    query = state["query"].lower()
    if any(word in query for word in ("drop", "create table", "alter table")):
        intent = "schema_change"
    elif any(word in query for word in ("change", "update", "delete", "insert")):
        intent = "write"
    else:
        intent = "read"
    return {"intent": intent, "parsed_request": {"tables": ["orders"]}}


def _fake_ambiguity(state):
    ambiguous = "delete old orders" in state["query"].lower() and not state.get(
        "clarification_history"
    )
    return {
        "is_ambiguous": ambiguous,
        "ask_questions": ["How old should the orders be?"] if ambiguous else None,
        "workflow_status": "awaiting_clarification" if ambiguous else "processing",
    }


def _fake_sql(state):
    query = state["query"].lower()
    if state["intent"] == "read":
        sql = "SELECT id, status FROM orders WHERE status = 'pending'"
    elif "delete" in query:
        sql = "DELETE FROM orders WHERE status = 'cancelled'"
    else:
        sql = "UPDATE orders SET status = 'shipped' WHERE id = 1"
    return {"generated_sql": sql}


@pytest.fixture
def workflow_client(monkeypatch, tmp_path):
    monkeypatch.setenv("OPENROUTER_API_KEY", "local-test-key")
    monkeypatch.setenv("GROQ_API_KEY", "local-test-key")

    database_connection = importlib.import_module("backend.database.connection")
    database_path = tmp_path / "app.db"
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

    graph_module = importlib.import_module("backend.agent.graph.build_graph")
    monkeypatch.setattr(graph_module, "CHECKPOINT_DB_PATH", tmp_path / "checkpoints.db")
    monkeypatch.setattr(graph_module, "parse_intent", _fake_intent)
    monkeypatch.setattr(graph_module, "ambiguity_checker", _fake_ambiguity)
    monkeypatch.setattr(graph_module, "generate_sql", _fake_sql)
    graph = graph_module.build_graph()

    main_module = importlib.import_module("backend.main")
    monkeypatch.setattr(main_module, "graph", graph)
    main_module.create_audit_table()

    return TestClient(main_module.app), graph, graph_module, database_path


def _status(database_path, order_id):
    connection = sqlite3.connect(database_path)
    try:
        return connection.execute(
            "SELECT status FROM orders WHERE id = ?", (order_id,)
        ).fetchone()[0]
    finally:
        connection.close()


def test_edit_is_revalidated_and_requires_approval(workflow_client):
    client, graph, _, database_path = workflow_client
    query = client.post("/query", json={"request": "Change order 1 status to shipped"})
    assert query.status_code == 200
    thread_id = query.json()["thread_id"]
    assert query.json()["workflow_status"] == "awaiting_approval"

    edit = client.post(
        f"/edit/{thread_id}",
        json={"sql": "UPDATE orders SET status = 'delivered' WHERE id = 2"},
    )
    assert edit.status_code == 200
    assert edit.json()["human_decision"] == "edited"
    assert edit.json()["workflow_status"] == "awaiting_approval"
    assert edit.json()["estimated_rows_affected"] == 1
    assert _status(database_path, 2) == "cancelled"

    approved = client.post(f"/approve/{thread_id}")
    assert approved.status_code == 200
    assert approved.json()["execution_result"]["success"] is True
    assert _status(database_path, 2) == "delivered"
    logs = client.get(f"/audit/{thread_id}").json()["logs"]
    assert len(logs) == 1
    assert logs[0]["human_decision"] == "approved"


def test_reject_never_executes_and_is_audited(workflow_client):
    client, graph, _, database_path = workflow_client
    query = client.post("/query", json={"request": "Change order 1 status to shipped"})
    thread_id = query.json()["thread_id"]

    rejected = client.post(f"/reject/{thread_id}")
    assert rejected.status_code == 200
    assert rejected.json()["workflow_status"] == "rejected"
    assert _status(database_path, 1) == "pending"
    assert client.post(f"/approve/{thread_id}").status_code == 409
    logs = client.get(f"/audit/{thread_id}").json()["logs"]
    assert logs[0]["human_decision"] == "rejected"


def test_clarification_resumes_same_thread_and_persistence_survives_rebuild(workflow_client):
    client, graph, graph_module, _ = workflow_client
    query = client.post("/query", json={"request": "Delete old orders"})
    assert query.status_code == 200
    initial = query.json()
    thread_id = initial["thread_id"]
    assert initial["workflow_status"] == "awaiting_clarification"
    assert initial["ask_questions"]

    config = {"configurable": {"thread_id": thread_id}}
    restarted_graph = graph_module.build_graph()
    restored = restarted_graph.get_state(config)
    assert restored.values["original_query"] == "Delete old orders"
    assert restored.next == ("clarification",)

    clarification = client.post(
        f"/clarify/{thread_id}",
        json={"answer": "Orders older than 90 days"},
    )
    assert clarification.status_code == 200
    assert clarification.json()["thread_id"] == thread_id
    assert clarification.json()["workflow_status"] == "awaiting_approval"
    assert clarification.json()["generated_sql"] == (
        "DELETE FROM orders WHERE status = 'cancelled'"
    )


def test_schema_change_is_blocked_and_unknown_threads_return_404(workflow_client):
    client, _, _, _ = workflow_client
    response = client.post("/query", json={"request": "Drop the orders table"})
    assert response.status_code == 200
    assert response.json()["workflow_status"] == "blocked"
    assert "schema_change_not_allowed" in response.json()["risk_flags"]
    assert client.post("/approve/not-a-thread").status_code == 404


def test_unsafe_edit_is_blocked_without_execution(workflow_client):
    client, _, _, database_path = workflow_client
    query = client.post("/query", json={"request": "Change order 1 status to shipped"})
    thread_id = query.json()["thread_id"]

    edit = client.post(
        f"/edit/{thread_id}",
        json={"sql": "UPDATE orders SET status = 'delivered' WHERE 1 = 1"},
    )
    assert edit.status_code == 200
    assert edit.json()["workflow_status"] == "blocked"
    assert "unrestricted_modification" in edit.json()["risk_flags"]
    assert _status(database_path, 1) == "pending"
    assert client.post(f"/approve/{thread_id}").status_code == 409


def test_read_request_executes_only_after_approval(workflow_client):
    client, _, _, _ = workflow_client
    query = client.post("/query", json={"request": "Show pending orders"})
    assert query.status_code == 200
    thread_id = query.json()["thread_id"]
    assert query.json()["intent"] == "read"
    assert query.json()["workflow_status"] == "awaiting_approval"

    approved = client.post(f"/approve/{thread_id}")
    assert approved.status_code == 200
    assert approved.json()["execution_result"]["type"] == "read"
    assert approved.json()["execution_result"]["row_count"] == 1


def test_failed_execution_is_audited(workflow_client):
    client, _, _, database_path = workflow_client
    query = client.post("/query", json={"request": "Change order 1 status to shipped"})
    thread_id = query.json()["thread_id"]
    connection = sqlite3.connect(database_path)
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

    approved = client.post(f"/approve/{thread_id}")
    assert approved.status_code == 200
    assert approved.json()["execution_result"]["success"] is False
    assert _status(database_path, 1) == "pending"
    assert client.get(f"/audit/{thread_id}").json()["logs"][0]["execution_result"]


def test_invalid_input_is_rejected(workflow_client):
    client, _, _, _ = workflow_client
    assert client.get("/").status_code == 200
    assert client.post("/query", json={"request": "   "}).status_code == 422
    assert client.post("/edit/missing", json={"sql": "UPDATE x SET y=1"}).status_code == 404