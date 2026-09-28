from backend.agent.graph.state import AgentState


def request_human_approval(state: AgentState) -> dict:
    """
    Prepare the information required for human approval.

    No database operation is executed here.
    """

    return {
        "human_decision": None
    }