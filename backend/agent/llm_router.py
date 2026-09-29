import os
import logging
from typing import Type, TypeVar, Optional, List, Any
from dotenv import load_dotenv
from pydantic import BaseModel
from langchain_core.messages import BaseMessage
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI

load_dotenv()
logger = logging.getLogger("llm_router")

T = TypeVar("T", bound=BaseModel)

# ==============================================================================
# Centralized LLM Configuration
# Modify models, temperature, and fallback order here.
# ==============================================================================
DEFAULT_GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
DEFAULT_OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct")
PRIMARY_PROVIDER = os.getenv("PRIMARY_LLM_PROVIDER", "groq").lower().strip()
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")


def get_llm(
    provider: str = "groq",
    model: Optional[str] = None,
    temperature: float = 0.0,
    structured_schema: Optional[Type[T]] = None,
):
    """
    Factory function to instantiate an LLM instance from Groq or OpenRouter.
    """
    provider = provider.lower().strip()

    if provider == "groq":
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is not configured in the environment.")
        llm = ChatGroq(
            model=model or DEFAULT_GROQ_MODEL,
            api_key=api_key,
            temperature=temperature,
        )
    elif provider == "openrouter":
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY is not configured in the environment.")
        llm = ChatOpenAI(
            base_url=OPENROUTER_BASE_URL,
            api_key=api_key,
            model=model or DEFAULT_OPENROUTER_MODEL,
            temperature=temperature,
        )
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}. Supported: 'groq', 'openrouter'.")

    if structured_schema is not None:
        return llm.with_structured_output(structured_schema)
    return llm


def is_rate_limit_or_token_error(exception: Exception) -> bool:
    """
    Checks if an exception is related to rate limits, quota limits, or token window exhaustion.
    """
    msg = str(exception).lower()
    keywords = [
        "rate limit",
        "ratelimit",
        "429",
        "quota",
        "token limit",
        "tokens per minute",
        "tpm",
        "rpm",
        "context length",
        "insufficient_quota",
        "resource has been exhausted",
        "overloaded",
    ]
    return any(keyword in msg for keyword in keywords)


def invoke_structured_with_fallback(
    messages: List[BaseMessage],
    structured_schema: Type[T],
    temperature: float = 0.0,
    max_attempts_per_provider: int = 2,
) -> T:
    """
    Standardized execution router:
    Attempts primary provider (default: Groq).
    If a rate limit, token limit, or API failure occurs, automatically routes to OpenRouter.
    """
    primary = PRIMARY_PROVIDER
    secondary = "openrouter" if primary == "groq" else "groq"

    # If primary has no API key, seamlessly switch to secondary if configured
    if primary == "groq" and not os.getenv("GROQ_API_KEY") and os.getenv("OPENROUTER_API_KEY"):
        primary = "openrouter"
        secondary = "groq"

    providers = [primary, secondary]
    last_error: Optional[Exception] = None

    for provider in providers:
        api_key = os.getenv(f"{provider.upper()}_API_KEY")
        if not api_key:
            continue

        model_name = DEFAULT_GROQ_MODEL if provider == "groq" else DEFAULT_OPENROUTER_MODEL
        for attempt in range(1, max_attempts_per_provider + 1):
            try:
                llm = get_llm(
                    provider=provider,
                    model=model_name,
                    temperature=temperature,
                    structured_schema=structured_schema,
                )
                result = llm.invoke(messages)
                if not isinstance(result, structured_schema):
                    if result is None:
                        raise ValueError(f"Provider {provider} returned None.")
                    result = structured_schema.model_validate(result)
                return result
            except Exception as exc:
                last_error = exc
                is_limit = is_rate_limit_or_token_error(exc)
                logger.warning(
                    f"[LLM Router] {provider} ({model_name}) attempt {attempt} failed: {exc} "
                    f"(rate/token limit: {is_limit})"
                )
                # If it's a rate limit or token limit, don't waste time retrying same provider; switch immediately
                if is_limit:
                    break

    raise RuntimeError(
        f"All LLM providers exhausted. Primary ({primary}) and secondary ({secondary}) failed. "
        f"Last error: {last_error}"
    ) from last_error
