from typing import Literal, TypedDict

class AgentState(TypedDict):
    query: str
    original_query: str
    clarification_history: list[str]
    intent: Literal["read", "write", "schema_change"]
    parsed_request: dict
    schema: str
    is_ambiguous: bool
    ask_questions: list[str] | None
    generated_sql: str | None
    validated_sql: str | None
    risk_flags: list[str]
    estimated_rows_affected: int | None
    human_decision: Literal["approved", "edited", "rejected"] | None
    workflow_status: Literal[
        "processing",
        "awaiting_clarification",
        "awaiting_approval",
        "blocked",
        "approved",
        "rejected",
        "completed",
        "execution_failed",
    ]
    execution_result: dict | None
    retry_count: int
