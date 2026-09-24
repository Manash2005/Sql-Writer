from typing import Literal
from pydantic import BaseModel, Field

class IntentResult(BaseModel):
    intent : Literal["read", "write", "schema_change"]
    tables_referenced: list[str] = None
    columns_referenced: list[str] = None 
    conditions_mentioned: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)

class AmbiguityResult(BaseModel):
    is_sufficient: bool
    missing_info: str | None = None
    clarifying_question: list[str] | None = None