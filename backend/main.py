import os
import uuid
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from backend.agent.graph.build_graph import build_graph
from backend.database.audit import create_audit_table, log_audit_event
from backend.database.connection import get_connection

load_dotenv()

app = FastAPI(
    title="SQL Editor",
    description="Safety-first Natural Language to SQL system",
    version="1.0.0"
)

# Configure CORS origins from environment
frontend_env = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
if os.getenv("FRONTEND_URL"):
    frontend_env.append(os.getenv("FRONTEND_URL").strip())

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
origins = list(dict.fromkeys(default_origins + frontend_env))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app" if "*" not in origins else None,
    allow_credentials=True if "*" not in origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_graph()
create_audit_table()

def _ensure_sandbox_seeded():
    connection = get_connection()
    try:
        table = connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        ).fetchone()
        if not table:
            from backend.database.sandbox_seed import seed_database
            seed_database()
    finally:
        connection.close()

_ensure_sandbox_seeded()


class QueryRequest(BaseModel):
    request: str = Field(min_length=1, max_length=4000)

    @field_validator("request")
    @classmethod
    def validate_request(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Request cannot be blank.")
        return value


class EditRequest(BaseModel):
    sql: str = Field(min_length=1, max_length=10000)

    @field_validator("sql")
    @classmethod
    def validate_sql(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("SQL cannot be blank.")
        return value


class ClarificationRequest(BaseModel):
    answer: str = Field(min_length=1, max_length=2000)

    @field_validator("answer")
    @classmethod
    def validate_answer(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Clarification cannot be blank.")
        return value


def _config(thread_id: str) -> dict[str, Any]:
    return {"configurable": {"thread_id": thread_id}}


def _get_pending_state(thread_id: str, node_name: str) -> tuple[dict[str, Any], dict[str, Any]]:
    config = _config(thread_id)
    checkpoint = graph.get_state(config)
    if not checkpoint.values:
        raise HTTPException(status_code=404, detail="Thread was not found.")
    if node_name not in checkpoint.next:
        raise HTTPException(status_code=409, detail="Thread is not waiting for this action.")
    return config, dict(checkpoint.values)


def _record_audit(
    thread_id: str,
    state: dict[str, Any],
    human_decision: str | None = None,
    execution_result: dict[str, Any] | None = None,
) -> None:
    log_audit_event(
        thread_id=thread_id,
        user_request=state.get("original_query", state.get("query", "")),
        intent=state.get("intent", "read"),
        generated_sql=state.get("generated_sql"),
        risk_flags=state.get("risk_flags", []),
        estimated_rows_affected=state.get("estimated_rows_affected"),
        human_decision=human_decision or state.get("human_decision"),
        execution_result=execution_result,
    )


def _response_state(thread_id: str, state: dict[str, Any]) -> dict[str, Any]:
    return {
        "thread_id": thread_id,
        "query": state.get("original_query", state.get("query")),
        "intent": state.get("intent"),
        "generated_sql": state.get("generated_sql"),
        "risk_flags": state.get("risk_flags", []),
        "estimated_rows_affected": state.get("estimated_rows_affected"),
        "ask_questions": state.get("ask_questions"),
        "human_decision": state.get("human_decision"),
        "workflow_status": state.get("workflow_status"),
    }

@app.get("/")
def root():
    return {
        "message": "Natural Language to SQL Agent is running"
    }


@app.get("/schema")
def get_schema():
    """Expose database schema for the frontend Database Explorer."""
    from backend.database.connection import get_connection

    connection = get_connection()
    try:
        tables_rows = connection.execute(
            """
            SELECT name FROM sqlite_master
            WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name;
            """
        ).fetchall()

        tables = []
        for row in tables_rows:
            table_name = row["name"]
            columns = connection.execute(
                f"PRAGMA table_info({table_name})"
            ).fetchall()
            
            data_rows = connection.execute(f"SELECT * FROM {table_name} LIMIT 50").fetchall()
            data = [dict(r) for r in data_rows]

            tables.append({
                "name": table_name,
                "columns": [
                    {"name": col["name"], "type": col["type"]}
                    for col in columns
                ],
                "data": data
            })

        return {"tables": tables}
    finally:
        connection.close()

@app.post("/query")
def query_database(payload: QueryRequest):
    thread_id = str(uuid.uuid4())
    initial_state = {
        "query": payload.request,
        "original_query": payload.request,
        "clarification_history": [],
        "intent": "read",
        "parsed_request": {},
        "schema": "",
        "is_ambiguous": False,
        "ask_questions": None,
        "generated_sql": None,
        "validated_sql": None,
        "risk_flags": [],
        "estimated_rows_affected": None,
        "human_decision": None,
        "workflow_status": "processing",
        "execution_result": None,
        "retry_count": 0,
    }

    config = _config(thread_id)
    try:
        graph.invoke(initial_state, config=config)
        state = dict(graph.get_state(config).values)
        _record_audit(thread_id, state)
    except HTTPException:
        raise
    except Exception as exc:
        _record_audit(
            thread_id,
            initial_state,
            execution_result={"success": False, "error": "Workflow failed."},
        )
        raise HTTPException(status_code=500, detail="The workflow failed unexpectedly.") from exc

    return _response_state(thread_id, state)


@app.post("/approve/{thread_id}")
def approve_query(thread_id: str):
    config, state = _get_pending_state(thread_id, "human_approval")
    if (
        state.get("workflow_status") != "awaiting_approval"
        or not state.get("generated_sql")
        or state.get("validated_sql") != state.get("generated_sql")
        or state.get("risk_flags")
        or state.get("human_decision") in {"approved", "rejected"}
    ):
        raise HTTPException(status_code=409, detail="Thread is not eligible for approval.")

    graph.update_state(config, {"human_decision": "approved", "workflow_status": "approved"})
    try:
        graph.invoke(None, config=config)
        state = dict(graph.get_state(config).values)
    except Exception as exc:
        state["workflow_status"] = "execution_failed"
        execution_result = {"success": False, "error": "Execution failed unexpectedly."}
        _record_audit(thread_id, state, human_decision="approved", execution_result=execution_result)
        raise HTTPException(status_code=500, detail="SQL execution failed.") from exc

    result = state.get("execution_result")
    _record_audit(thread_id, state, human_decision="approved", execution_result=result)
    return {
        "thread_id": thread_id,
        "human_decision": state.get("human_decision"),
        "workflow_status": state.get("workflow_status"),
        "execution_result": result,
    }


@app.post("/reject/{thread_id}")
def reject_query(thread_id: str):
    config = _config(thread_id)
    checkpoint = graph.get_state(config)
    if not checkpoint.values:
        raise HTTPException(status_code=404, detail="Thread was not found.")

    state = dict(checkpoint.values)
    if (
        not ({"clarification", "human_approval"} & set(checkpoint.next))
        or state.get("workflow_status") not in {"awaiting_clarification", "awaiting_approval"}
    ):
        raise HTTPException(status_code=409, detail="Thread cannot be rejected in its current state.")

    graph.update_state(config, {"human_decision": "rejected", "workflow_status": "rejected"})
    graph.invoke(None, config=config)
    state = dict(graph.get_state(config).values)
    _record_audit(thread_id, state, human_decision="rejected")
    return {"thread_id": thread_id, "human_decision": "rejected", "workflow_status": "rejected"}


@app.post("/edit/{thread_id}")
def edit_query(thread_id: str, payload: EditRequest):
    config, state = _get_pending_state(thread_id, "human_approval")
    if (
        state.get("workflow_status") != "awaiting_approval"
        or state.get("human_decision") in {"approved", "rejected"}
    ):
        raise HTTPException(status_code=409, detail="Thread is not waiting for an SQL edit.")

    graph.update_state(
        config,
        {
            "generated_sql": payload.sql,
            "validated_sql": None,
            "risk_flags": [],
            "estimated_rows_affected": None,
            "human_decision": "edited",
            "workflow_status": "processing",
            "execution_result": None,
        },
    )
    try:
        graph.invoke(None, config=config)
        state = dict(graph.get_state(config).values)
    except Exception as exc:
        state["generated_sql"] = payload.sql
        state["human_decision"] = "edited"
        _record_audit(thread_id, state, human_decision="edited")
        raise HTTPException(status_code=500, detail="Edited SQL validation failed unexpectedly.") from exc

    _record_audit(thread_id, state, human_decision="edited")
    return _response_state(thread_id, state)


@app.post("/clarify/{thread_id}")
def clarify_query(thread_id: str, payload: ClarificationRequest):
    config, state = _get_pending_state(thread_id, "clarification")
    if state.get("workflow_status") != "awaiting_clarification":
        raise HTTPException(status_code=409, detail="Thread is not waiting for clarification.")

    history = [*state.get("clarification_history", []), payload.answer]
    original_query = state.get("original_query", state["query"])
    clarified_query = "\n".join(
        [f"User request: {original_query}", *(f"Clarification: {answer}" for answer in history)]
    )
    graph.update_state(
        config,
        {
            "query": clarified_query,
            "clarification_history": history,
            "workflow_status": "processing",
        },
    )
    try:
        graph.invoke(None, config=config)
        state = dict(graph.get_state(config).values)
    except Exception as exc:
        _record_audit(thread_id, state)
        raise HTTPException(status_code=500, detail="Clarification processing failed.") from exc

    _record_audit(thread_id, state)
    return _response_state(thread_id, state)


@app.get("/audit")
def get_all_audit_logs():
    connection = get_connection()
    try:
        rows = connection.execute(
            """
            SELECT
                id,
                thread_id,
                user_request,
                intent,
                generated_sql,
                risk_flags,
                estimated_rows_affected,
                human_decision,
                execution_result,
                created_at
            FROM audit_logs
            ORDER BY id DESC
            """
        ).fetchall()
        return {"logs": [dict(row) for row in rows]}
    finally:
        connection.close()


@app.delete("/audit")
def delete_all_audit_logs():
    from backend.database.audit import clear_audit_logs
    clear_audit_logs()
    return {"message": "All audit logs cleared successfully"}


@app.get("/audit/{thread_id}")
def get_audit_log(thread_id: str):
    connection = get_connection()

    try:
        rows = connection.execute(
            """
            SELECT
                id,
                thread_id,
                user_request,
                intent,
                generated_sql,
                risk_flags,
                estimated_rows_affected,
                human_decision,
                execution_result,
                created_at
            FROM audit_logs
            WHERE thread_id = ?
            ORDER BY id DESC
            """,
            (thread_id,),
        ).fetchall()

        return {
            "thread_id": thread_id,
            "logs": [dict(row) for row in rows],
        }

    finally:
        connection.close()