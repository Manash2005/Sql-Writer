from backend.agent.graph.state import AgentState


def route_after_intent(state: AgentState) -> str:
    return "blocked" if state["intent"] == "schema_change" else "continue"


def route_after_ambiguity(state: AgentState) -> str:
    return "clarification" if state["is_ambiguous"] else "schema"


def route_after_clarification(state: AgentState) -> str:
    return "reject" if state.get("human_decision") == "rejected" else "continue"


def route_after_validation(state: AgentState) -> str:
    """
    Decide what happens after SQL validation.
    """

    if state["risk_flags"]:
        return "blocked"

    return "approval"


def route_after_human_decision(state: AgentState) -> str:
    decision = state.get("human_decision")
    if decision == "approved":
        return "execute"
    if decision == "edited":
        return "revalidate"
    if decision == "rejected":
        return "reject"
    return "wait"