import sqlite3
from pathlib import Path

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph

from backend.agent.graph.nodes.ambiguity_checker import ambiguity_checker
from backend.agent.graph.nodes.executor import execute_sql
from backend.agent.graph.nodes.human_approval import request_human_approval
from backend.agent.graph.nodes.intent_parser import parse_intent
from backend.agent.graph.nodes.sql_generator import generate_sql
from backend.agent.graph.nodes.validator import validate_sql
from backend.agent.graph.routes import (
    route_after_ambiguity,
    route_after_clarification,
    route_after_human_decision,
    route_after_intent,
    route_after_validation,
)
from backend.agent.graph.state import AgentState
from backend.database.schema_introspect import get_database_schema


PROJECT_ROOT = Path(__file__).resolve().parents[3]
CHECKPOINT_DB_PATH = PROJECT_ROOT / "data" / "checkpoints.db"


def load_schema(state: AgentState) -> dict:
    return {
        "schema": get_database_schema()
    }


def accept_clarification(state: AgentState) -> dict:
    if state.get("human_decision") == "rejected":
        return {"workflow_status": "rejected"}

    return {
        "is_ambiguous": False,
        "ask_questions": None,
        "workflow_status": "processing",
    }


def block_schema_change(state: AgentState) -> dict:
    return {
        "risk_flags": ["schema_change_not_allowed"],
        "workflow_status": "blocked",
    }


def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("intent_parser", parse_intent)
    graph.add_node("block_schema_change", block_schema_change)
    graph.add_node("ambiguity_checker", ambiguity_checker)
    graph.add_node("clarification", accept_clarification)
    graph.add_node("load_schema", load_schema)
    graph.add_node("sql_generator", generate_sql)
    graph.add_node("validator", validate_sql)
    graph.add_node("human_approval", request_human_approval)
    graph.add_node("executor", execute_sql)

    graph.add_edge(START, "intent_parser")
    graph.add_conditional_edges(
        "intent_parser",
        route_after_intent,
        {
            "blocked": "block_schema_change",
            "continue": "ambiguity_checker",
        },
    )
    graph.add_edge("block_schema_change", END)

    graph.add_conditional_edges(
        "ambiguity_checker",
        route_after_ambiguity,
        {
            "clarification": "clarification",
            "schema": "load_schema",
        },
    )
    graph.add_conditional_edges(
        "clarification",
        route_after_clarification,
        {
            "continue": "intent_parser",
            "reject": END,
        },
    )

    graph.add_edge("load_schema", "sql_generator")
    graph.add_edge("sql_generator", "validator")

    graph.add_conditional_edges(
        "validator",
        route_after_validation,
        {
            "blocked": END,
            "approval": "human_approval",
        },
    )

    graph.add_edge("executor", END)
    graph.add_conditional_edges(
        "human_approval",
        route_after_human_decision,
        {
            "execute": "executor",
            "revalidate": "validator",
            "reject": END,
            "wait": END,
        },
    )

    CHECKPOINT_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    checkpointer = SqliteSaver(
        sqlite3.connect(
            CHECKPOINT_DB_PATH,
            check_same_thread=False,
        )
    )
    checkpointer.setup()

    return graph.compile(
        checkpointer=checkpointer,
        interrupt_before=["clarification", "human_approval"],
    )