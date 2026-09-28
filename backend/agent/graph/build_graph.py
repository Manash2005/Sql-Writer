from langgraph.graph import END, START, StateGraph

from backend.agent.graph.state import AgentState
from backend.agent.graph.nodes.ambiguity_checker import ambiguity_checker
from backend.agent.graph.nodes.intent_parser import parse_intent
from backend.agent.graph.nodes.sql_generator import generate_sql
from backend.database.schema_introspect import get_database_schema
from backend.agent.graph.nodes.validator import validate_sql
from backend.agent.graph.nodes.human_approval import request_human_approval
from backend.agent.graph.routes import route_after_validation


def load_schema(state: AgentState) -> dict:
    return {
        "schema": get_database_schema()
    }


def build_graph():
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("intent_parser", parse_intent)
    graph.add_node("ambiguity_checker", ambiguity_checker)
    graph.add_node("load_schema", load_schema)
    graph.add_node("sql_generator", generate_sql)
    graph.add_node("validator", validate_sql)
    graph.add_node("human_approval", request_human_approval)

    # Starting point
    graph.add_edge(START, "intent_parser")

    # Intent → ambiguity
    graph.add_edge("intent_parser", "ambiguity_checker")

    # Ambiguity routing
    graph.add_conditional_edges(
        "ambiguity_checker",
        lambda state: (
            "clarify"
            if state["is_ambiguous"]
            else "load_schema"
        ),
        {
            "clarify": END,
            "load_schema": "load_schema",
        },
    )

    # Schema → SQL generation
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

    graph.add_edge("human_approval", END)


    return graph.compile()