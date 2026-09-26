from backend.agent.graph.build_graph import build_graph


graph = build_graph()

initial_state = {
    "query": "Show me all pending orders from the last 7 days.",
    "intent": "read",
    "parsed_request": {},
    "schema": "",
    "is_ambiguous": False,
    "ask_question": None,
    "generated_sql": None,
    "risk_flags": [],
    "estimated_rows_affected": None,
    "human_decision": None,
    "execution_result": None,
    "retry_count": 0,
}

result = graph.invoke(initial_state)

print("\nGenerated SQL:")
print(result["generated_sql"])

print("\nRisk flags:")
print(result["risk_flags"])