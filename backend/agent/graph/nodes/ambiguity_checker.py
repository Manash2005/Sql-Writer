from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openrouter import ChatOpenRouter
from dotenv import load_dotenv

from backend.agent.schemas.pydantic_models import AmbiguityResult
from backend.agent.graph.state import AgentState

load_dotenv()

llm = ChatOpenRouter(model='openrouter/free')
structured_llm = llm.with_structured_output(AmbiguityResult)

SYSTEM_PROMPT = """
You are an ambiguity and completeness checker for a safety-first
Natural Language to SQL system.

Your job is to determine whether the user's request contains enough
information to safely generate SQL.

The system must NEVER guess missing information.

A request is insufficient when important information needed to determine
the intended database operation is missing.

Pay particular attention to write operations:

- UPDATE requests need a clearly defined scope.
- DELETE requests need a clearly defined scope.
- INSERT requests need enough information to determine what should be inserted.
- Requests involving multiple possible tables or meanings may require clarification.

Examples:

"Show me all orders from last week."
→ sufficient

"Delete old orders."
→ insufficient because "old" is not defined.

"Update all users' status."
→ insufficient because no target status or row scope is specified.

"Update users who have been inactive for 90 days to archived."
→ sufficient.

"Drop the users table."
→ insufficient for this system because schema-changing operations
are blocked in v1.

Do not generate SQL.

Return:
- whether the request is sufficient
- what information is missing, if any
- one targeted clarification question if information is missing

Ask only one clarification question at a time.
"""

def ambiguity_checker(state : AgentState) -> dict:
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage
        (   
            content=f"""
            User request:
            {state["query"]}

            Detected intent:
            {state["intent"]}

            Parsed entities:
            {state["parsed_request"]}
            """
        )
    ]
    result = structured_llm.invoke(messages)

    return {
        "is_ambiguous" : not result.is_sufficient,
        "ask_questions" : result.clarifying_question
    }