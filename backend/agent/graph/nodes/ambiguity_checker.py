import json
import os

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from dotenv import load_dotenv

from backend.agent.schemas.pydantic_models import AmbiguityResult
from backend.agent.graph.state import AgentState

load_dotenv()

llm = ChatGroq(
    model="qwen/qwen3.8-27b",
    api_key=os.getenv("GROQ_API_KEY"),
)
structured_llm = llm.with_structured_output(AmbiguityResult)

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

    for attempt in range(1, MAX_ATTEMPTS + 1):
        system_prompt = SYSTEM_PROMPT
        if attempt == MAX_ATTEMPTS:
            system_prompt += (
                STRICT_OUTPUT_PROMPT
                + "\nPydantic schema:\n"
                + json.dumps(AmbiguityResult.model_json_schema())
            )

        messages = [
            SystemMessage(content=system_prompt),
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

        try:
            result = structured_llm.invoke(messages)
            if not isinstance(result, AmbiguityResult):
                if result is None:
                    raise ValueError("The model returned no structured result.")
                result = AmbiguityResult.model_validate(result)
            break
        except Exception as exc:
            if attempt == MAX_ATTEMPTS:
                raise RuntimeError(
                    "Ambiguity checking failed to return valid structured output "
                    f"after {MAX_ATTEMPTS} attempts."
                ) from exc
            print(f"Ambiguity structured output failed on attempt {attempt}; retrying.")

    if result.is_sufficient:
        print("No ambiguity found")
    else:
        print("Ambiguous")

    return {
        "is_ambiguous" : not result.is_sufficient,
        "ask_questions" : result.clarifying_question,
        "workflow_status": "awaiting_clarification" if not result.is_sufficient else "processing",
    }