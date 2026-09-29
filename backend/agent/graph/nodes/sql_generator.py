from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage

from backend.agent.schemas.pydantic_models import SQLResult
from backend.agent.graph.state import AgentState
from backend.agent.llm_router import invoke_structured_with_fallback

load_dotenv()

SYSTEM_PROMPT = """
You are a SQL generation agent for a safety-first Natural Language
to SQL system.

Your job is to convert the user's natural-language request into SQL.

The database is SQLite3.

You will receive the actual database schema. You MUST use only the
tables and columns present in that schema.

Rules:

1. Never invent a table or column.
2. Never assume a table or column that is not present in the schema.
3. Generate valid SQLite SQL.
4. Do not generate SQL for schema-changing operations such as
   CREATE, ALTER, or DROP.
5. Do not add conditions that the user did not request.
6. Preserve the user's requested scope exactly.
7. For UPDATE and DELETE operations, include the appropriate WHERE
   condition based on the user's request.
8. Never silently turn an ambiguous request into a query affecting
   all rows.
9. Return only the SQL through the structured output.
10. Do not explain the SQL.

The request has already passed the ambiguity/completeness check.
"""

def generate_sql(state : AgentState) -> dict:
   messages = [
         SystemMessage(content=SYSTEM_PROMPT),
         HumanMessage(
            content=f"""
               Database schema:

               {state["schema"]}

               User request:
               {state["query"]}

               Detected intent:
               {state["intent"]}

               Parsed entities:
               {state["parsed_request"]}
            """
         )
   ]

   print("\nGenerating SQL....")
   result = invoke_structured_with_fallback(
      messages=messages,
      structured_schema=SQLResult,
   )
   return {
      "generated_sql": result.sql
   }

