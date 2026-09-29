import uuid


def run_graph_smoke_test() -> None:
    from backend.agent.graph.build_graph import build_graph

    graph = build_graph()
    initial_state = {
        "query": "Show me all pending orders from the last 7 days.",
        "original_query": "Show me all pending orders from the last 7 days.",
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

    result = graph.invoke(
        initial_state,
        config={"configurable": {"thread_id": str(uuid.uuid4())}},
    )
    print("Generated SQL:", result["generated_sql"])
    print("Risk flags:", result["risk_flags"])
    print("Estimated rows affected:", result["estimated_rows_affected"])
    print("Workflow status:", result["workflow_status"])


if __name__ == "__main__":
    run_graph_smoke_test()