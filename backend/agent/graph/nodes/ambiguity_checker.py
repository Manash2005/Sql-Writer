from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage

from backend.agent.schemas.pydantic_models import AmbiguityResult
from backend.agent.graph.state import AgentState
from backend.agent.llm_router import invoke_structured_with_fallback

load_dotenv()

MAX_ATTEMPTS = 3

SYSTEM_PROMPT = """
You are an ambiguity and completeness checker for a safety-first
Natural Language to SQL system.

Your job is to determine whether the user's request contains enough
information to safely generate SQL.

The system must NEVER guess missing information for destructive operations.

Rules for sufficiency:
- For read operations (retrieval / inspection): Be helpful and lenient. Do not demand clarification for common business questions (e.g. "customers who paid the most" can naturally use SUM of order totals; "pending orders" can use status = 'pending'). Mark read requests as sufficient unless completely incomprehensible.
- For write operations (UPDATE / DELETE): Require a defined scope or condition. "Delete old orders" is insufficient because "old" is undefined. "Update status" without a target value or user filter is insufficient.
- If clarification history is present, incorporate the user's answers and proceed.

Do not generate SQL.

Return:
- whether the request is sufficient (is_sufficient: true/false)
- what information is missing, if any
- one targeted clarification question if information is missing
"""

STRICT_OUTPUT_PROMPT = """
Your previous response did not provide valid structured output. Return exactly
one result that validates against the Pydantic schema below. Do not include
Markdown, explanations, or text outside the structured result.
"""

def ambiguity_checker(state : AgentState) -> dict:
    print("\nChecking For Ambiguity....")

    clarification_history = state.get("clarification_history") or []

    # If the user has already provided clarification (or clicked skip), proceed to SQL generation immediately.
    # Never trap the user in a clarification loop.
    if clarification_history:
        print("Clarification provided by user. Proceeding directly to SQL generation.")
        return {
            "is_ambiguous": False,
            "ask_questions": None,
            "workflow_status": "processing",
        }

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(
            content=f"""
            User request:
            {state["query"]}

            Detected intent:
            {state["intent"]}

            Parsed entities:
            {state["parsed_request"]}
            """
        ),
    ]

    result = invoke_structured_with_fallback(
        messages=messages,
        structured_schema=AmbiguityResult,
    )

    if result.is_sufficient:
        print("No ambiguity found")
    else:
        print("Ambiguous")

    return {
        "is_ambiguous" : not result.is_sufficient,
        "ask_questions" : result.clarifying_question,
        "workflow_status": "awaiting_clarification" if not result.is_sufficient else "processing",
    }