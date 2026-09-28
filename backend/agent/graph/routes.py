from backend.agent.graph.state import AgentState


def route_after_validation(state: AgentState) -> str:
    """
    Decide what happens after SQL validation.
    """

    if state["risk_flags"]:
        return "blocked"

    return "approval"