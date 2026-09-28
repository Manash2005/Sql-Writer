import json
import os

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openrouter import ChatOpenRouter
from dotenv import load_dotenv

from backend.agent.schemas.pydantic_models import AmbiguityResult
from backend.agent.graph.state import AgentState

load_dotenv()

llm = ChatOpenRouter(model='openrouter/free', api_key=os.getenv('OPENROUTER_API_KEY'))
structured_llm = llm.with_structured_output(AmbiguityResult)

MAX_ATTEMPTS = 3

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

STRICT_OUTPUT_PROMPT = """
Your previous response did not provide valid structured output. Return exactly
one result that validates against the Pydantic schema below. Do not include
Markdown, explanations, or text outside the structured result.
"""

def ambiguity_checker(state : AgentState) -> dict:
    print("\nChecking For Ambiguity....")

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
        "ask_questions" : result.clarifying_question
    }