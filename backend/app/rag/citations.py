from typing import List
from app.schemas.responses import SourceChunk


def build_llm_context(sources: List[SourceChunk]) -> str:
    """Format retrieved document chunks into structured context blocks for LLM prompt."""
    if not sources:
        return "No relevant context passages available."

    context_blocks = []
    for idx, source in enumerate(sources, 1):
        block = (
            f"[Source {idx} | DocID: {source.doc_id} | ChunkID: {source.chunk_id}]\n"
            f"{source.text.strip()}"
        )
        context_blocks.append(block)

    return "\n\n".join(context_blocks)


def format_citations_summary(sources: List[SourceChunk]) -> List[dict]:
    """Format sources for lightweight logging or UI reference."""
    return [
        {
            "chunk_id": s.chunk_id,
            "doc_id": s.doc_id,
            "score": s.score,
            "language": s.metadata.get("language", "unknown"),
        }
        for s in sources
    ]
