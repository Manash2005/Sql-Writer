from langgraph.graph import StateGraph, START, END
from backend.agent.graph.state import AgentState

def build_graph():

    graph = StateGraph(AgentState)


    return graph.compile()