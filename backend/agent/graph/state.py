from typing import TypedDict, Literal

class AgentState(TypedDict):
    query : str
    intent : Literal['read', 'write', 'schema_change']
    parsed_request : dict
    is_ambiguous : bool
    ask_questions : list[str] | None
    generated_sql : str | None
    risk_flags : list[str]
    estimated_rows_affected : int | None
    human_decision : Literal["approved", "edited", "rejected"] | None
    execution_result : dict | None
    retry_count : int
