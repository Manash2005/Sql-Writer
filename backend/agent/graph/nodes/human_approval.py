from backend.agent.graph.state import AgentState


def request_human_approval(state: AgentState) -> dict:
    decision = state.get("human_decision")
    if decision == "approved":
        return {"workflow_status": "approved"}
    if decision == "rejected":
        return {"workflow_status": "rejected"}
    if decision == "edited":
        return {"workflow_status": "processing"}
    return {"workflow_status": "awaiting_approval"}