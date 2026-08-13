import re
import math
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple


# Regex pattern for Indic (Devanagari danda ।) and English sentence delimiters
SENTENCE_SPLIT_REGEX = re.compile(r"(?<=[.!?।])\s+|\n+")


def count_tokens(text: str) -> int:
    """Estimate token count for Indic and English text based on whitespace word boundaries."""
    if not text:
        return 0
    return len(text.strip().split())


def split_sentences(text: str) -> List[str]:
    """Split text into sentences preserving sentence boundaries for Indic & English."""
    if not text or not text.strip():
        return []
    raw_sentences = SENTENCE_SPLIT_REGEX.split(text.strip())
    sentences = [s.strip() for s in raw_sentences if s.strip()]
    return sentences if sentences else [text.strip()]


def get_char_ngrams(text: str, n_range: Tuple[int, int] = (3, 5)) -> Counter:
    """Extract character n-grams for language-agnostic text similarity computation."""
    text_clean = text.lower().replace(" ", "")
    ngrams = Counter()
    for n in range(n_range[0], n_range[1] + 1):
        for i in range(len(text_clean) - n + 1):
            ngrams[text_clean[i : i + n]] += 1
    return ngrams


def compute_sentence_similarity(s1: str, s2: str) -> float:
    """Compute cosine similarity between two sentences using character n-gram TF vectors."""
    if not s1 or not s2:
        return 0.0
    ngrams1 = get_char_ngrams(s1)
    ngrams2 = get_char_ngrams(s2)

    intersection = set(ngrams1.keys()) & set(ngrams2.keys())
    dot_product = sum(ngrams1[x] * ngrams2[x] for x in intersection)

    norm1 = math.sqrt(sum(v * v for v in ngrams1.values()))
    norm2 = math.sqrt(sum(v * v for v in ngrams2.values()))

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return dot_product / (norm1 * norm2)


class AdaptiveSemanticChunker:
    """Advanced Adaptive & Semantic Chunker preserving sentence boundaries, semantic topic shifts, and overlap."""

    def __init__(
        self,
        min_tokens: int = 150,
        max_tokens: int = 300,
        overlap_sentences: int = 1,
        similarity_threshold: float = 0.25,
    ):
        self.min_tokens = min_tokens
        self.max_tokens = max_tokens
        self.overlap_sentences = overlap_sentences
        self.similarity_threshold = similarity_threshold

    def chunk_passage(
        self,
        passage_text: str,
        document_id: str,
        passage_id: str,
        language: str = "hi",
        source_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Chunk a single passage into semantic sentence-aligned chunks."""
        if not passage_text or not passage_text.strip():
            return []

        sentences = split_sentences(passage_text)
        total_tokens = count_tokens(passage_text)

        source_meta = source_metadata or {}

        # If passage is shorter than max_tokens, return as single chunk
        if total_tokens <= self.max_tokens or len(sentences) <= 1:
            return [
                {
                    "chunk_id": f"{passage_id}_C0",
                    "document_id": document_id,
                    "passage_id": passage_id,
                    "language": language,
                    "chunk_position": 0,
                    "token_count": total_tokens,
                    "sentence_count": len(sentences),
                    "parent_id": passage_id,
                    "text": passage_text.strip(),
                    "source_metadata": source_meta,
                }
            ]

        chunks = []
        current_sentences = []
        current_token_count = 0
        chunk_index = 0

        for i, sentence in enumerate(sentences):
            sent_tokens = count_tokens(sentence)

            # Check if adding current sentence exceeds max_tokens
            # OR if we reached min_tokens and there is a semantic topic shift to next sentence
            should_split = False
            if current_sentences:
                if current_token_count + sent_tokens > self.max_tokens:
                    should_split = True
                elif current_token_count >= self.min_tokens and i > 0:
                    prev_sent = sentences[i - 1]
                    sim = compute_sentence_similarity(prev_sent, sentence)
                    if sim < self.similarity_threshold:
                        should_split = True

            if should_split and current_sentences:
                chunk_text = " ".join(current_sentences)
                chunks.append(
                    {
                        "chunk_id": f"{passage_id}_C{chunk_index}",
                        "document_id": document_id,
                        "passage_id": passage_id,
                        "language": language,
                        "chunk_position": chunk_index,
                        "token_count": count_tokens(chunk_text),
                        "sentence_count": len(current_sentences),
                        "parent_id": passage_id,
                        "text": chunk_text,
                        "source_metadata": source_meta,
                    }
                )
                chunk_index += 1

                # Apply sentence-level overlap
                overlap_sents = current_sentences[-self.overlap_sentences :] if self.overlap_sentences > 0 else []
                current_sentences = list(overlap_sents)
                current_token_count = sum(count_tokens(s) for s in current_sentences)

            current_sentences.append(sentence)
            current_token_count += sent_tokens

        # Flush final remaining chunk
        if current_sentences:
            chunk_text = " ".join(current_sentences)
            chunks.append(
                {
                    "chunk_id": f"{passage_id}_C{chunk_index}",
                    "document_id": document_id,
                    "passage_id": passage_id,
                    "language": language,
                    "chunk_position": chunk_index,
                    "token_count": count_tokens(chunk_text),
                    "sentence_count": len(current_sentences),
                    "parent_id": passage_id,
                    "text": chunk_text,
                    "source_metadata": source_meta,
                }
            )

        return chunks

    def fixed_size_chunking(
        self, text: str, chunk_size_tokens: int = 200, overlap_tokens: int = 40
    ) -> List[str]:
        """Baseline fixed token window splitting for comparison evaluation."""
        words = text.strip().split()
        if not words:
            return []

        chunks = []
        step = max(1, chunk_size_tokens - overlap_tokens)
        for i in range(0, len(words), step):
            chunk_words = words[i : i + chunk_size_tokens]
            chunks.append(" ".join(chunk_words))
            if i + chunk_size_tokens >= len(words):
                break
        return chunks
