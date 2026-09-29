from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage

from backend.agent.schemas.pydantic_models import IntentResult
from backend.agent.graph.state import AgentState
from backend.agent.llm_router import invoke_structured_with_fallback

load_dotenv()

SYSTEM_PROMPT = """
You are an intent classification agent for a safety-first Natural Language
to SQL system.

Your job is to analyze the user's natural-language database request.

Classify the request into exactly one of:

- read: The user only wants to retrieve or inspect data.
- write: The user wants to insert, update, or delete data.
- schema_change: The user wants to create, alter, or drop database structures.

Also extract:

1. The database tables explicitly referenced by the user.
2. The database columns explicitly referenced by the user.
3. Any conditions, filters, or constraints mentioned by the user.
4. Your confidence in the classification.

Important rules:

- Do not invent table names or column names.
- If the user does not explicitly mention a table or column, leave it out.
- Do not generate SQL.
- Do not assume missing conditions.
"""

MAX_ATTEMPTS = 3

STRICT_OUTPUT_PROMPT = """
Your previous response did not provide valid structured output. Return exactly
one result that validates against the Pydantic schema below. Do not include
Markdown, explanations, or text outside the structured result.
"""

def parse_intent(state: AgentState) -> dict:
    print("\nChecking Intent....")
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=state['query']),
    ]
    result = invoke_structured_with_fallback(
        messages=messages,
        structured_schema=IntentResult,
    )

    return {
        "intent": result.intent,
        "parsed_request": {
            "tables": result.tables_referenced,
            "columns": result.columns_referenced,
            "conditions": result.conditions_mentioned,
        },
    }

