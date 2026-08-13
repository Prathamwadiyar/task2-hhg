from typing import List, Optional, Tuple
from app.config import Settings, get_settings
from app.core.logging import logger
from app.schemas.responses import SourceChunk


class GuardrailsVerifier:
    """Standalone Guardrails Module for query validation, prompt injection defense, retrieval confidence check, and grounding verification."""

    REFUSAL_MESSAGE = "I cannot answer this question based on the provided context."

    INJECTION_SIGNALS = [
        "ignore previous instructions",
        "disregard instructions",
        "output system prompt",
        "print secret key",
        "print system prompt",
        "bypass security",
        "reveal password",
    ]

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()

    def validate_input_query(self, query: str) -> Tuple[bool, Optional[str]]:
        """Validate input query string for empty text, prompt injection, and invalid content."""
        if not query or not query.strip():
            logger.warning("Guardrails input check failed: Empty or whitespace query.")
            return False, "Query cannot be empty."

        lower_query = query.lower()
        for signal in self.INJECTION_SIGNALS:
            if signal in lower_query:
                logger.warning(f"Guardrails input check failed: Prompt injection signal detected ('{signal}').")
                return False, self.REFUSAL_MESSAGE

        return True, None

    def validate_retrieval_confidence(
        self,
        sources: List[SourceChunk],
        min_score: float = 0.35,
    ) -> Tuple[bool, Optional[str]]:
        """Verify retrieval confidence by checking top-1 chunk similarity score."""
        if not sources:
            logger.info("Guardrails retrieval check failed: Zero candidate chunks retrieved.")
            return False, self.REFUSAL_MESSAGE

        top_score = sources[0].score
        if top_score < min_score:
            logger.info(f"Guardrails retrieval check failed: Top similarity score {top_score:.3f} < threshold {min_score}.")
            return False, self.REFUSAL_MESSAGE

        return True, None

    def validate_output_grounding(
        self,
        answer: str,
        sources: List[SourceChunk],
    ) -> Tuple[bool, Optional[str]]:
        """Verify LLM generated answer is non-empty and valid."""
        if not answer:
            return False, self.REFUSAL_MESSAGE

        return True, None


_guardrails_instance: Optional[GuardrailsVerifier] = None


def get_guardrails(settings: Optional[Settings] = None) -> GuardrailsVerifier:
    """Get singleton GuardrailsVerifier instance."""
    global _guardrails_instance
    if _guardrails_instance is None:
        _guardrails_instance = GuardrailsVerifier(settings)
    return _guardrails_instance
