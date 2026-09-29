import json
import os
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage

from backend.agent.schemas.pydantic_models import IntentResult
from backend.agent.graph.state import AgentState
load_dotenv()

llm = ChatGroq(
    model="qwen/qwen3.8-27b",
    api_key=os.getenv("GROQ_API_KEY"),
)
structured_llm = llm.with_structured_output(IntentResult)

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

def parse_intent(state : AgentState) -> dict:
    print()
    print("Checking Intent....")

    for attempt in range(1, MAX_ATTEMPTS + 1):
        system_prompt = SYSTEM_PROMPT
        if attempt == MAX_ATTEMPTS:
            system_prompt += (
                STRICT_OUTPUT_PROMPT
                + "\nPydantic schema:\n"
                + json.dumps(IntentResult.model_json_schema())
            )

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=state['query']),
        ]

        try:
            result = structured_llm.invoke(messages)
            if not isinstance(result, IntentResult):
                if result is None:
                    raise ValueError("The model returned no structured result.")
                result = IntentResult.model_validate(result)
            break
        except Exception as exc:
            if attempt == MAX_ATTEMPTS:
                raise RuntimeError(
                    f"Intent parsing failed to return valid structured output "
                    f"after {MAX_ATTEMPTS} attempts."
                ) from exc
            print(f"Intent structured output failed on attempt {attempt}; retrying.")

    return {
        "intent": result.intent,
        "parsed_request": {
            "tables": result.tables_referenced,
            "columns": result.columns_referenced,
            "conditions": result.conditions_mentioned,
        },
    }

