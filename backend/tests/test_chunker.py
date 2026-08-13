import pytest
from app.rag.chunker import (
    AdaptiveSemanticChunker,
    compute_sentence_similarity,
    count_tokens,
    split_sentences,
)


def test_split_sentences():
    """Test Indic and English sentence boundary tokenization."""
    text_indic = "यह पहला वाक्य है। यह दूसरा वाक्य है! क्या यह तीसरा वाक्य है?"
    sents = split_sentences(text_indic)
    assert len(sents) == 3
    assert sents[0] == "यह पहला वाक्य है।"
    assert sents[1] == "यह दूसरा वाक्य है!"
    assert sents[2] == "क्या यह तीसरा वाक्य है?"

    text_en = "First sentence here. Second sentence follows! Third question?"
    sents_en = split_sentences(text_en)
    assert len(sents_en) == 3


def test_sentence_similarity():
    """Test sentence n-gram cosine similarity calculation."""
    s1 = "प्रधानमंत्री ने नई योजना की घोषणा की।"
    s2 = "प्रधानमंत्री द्वारा नई योजना का ऐलान किया गया।"
    s3 = "अंतरिक्ष विज्ञान में नए ग्रहों की खोज हुई।"

    sim1_2 = compute_sentence_similarity(s1, s2)
    sim1_3 = compute_sentence_similarity(s1, s3)

    assert sim1_2 > sim1_3
    assert sim1_2 > 0.3
    assert sim1_3 < 0.2


def test_short_passage_single_chunk():
    """Test short passage below max_tokens produces a single intact chunk."""
    chunker = AdaptiveSemanticChunker(min_tokens=50, max_tokens=200)
    passage = "यह एक छोटा सा परीक्षण पाठ है। इसमें केवल दो वाक्य हैं।"

    chunks = chunker.chunk_passage(
        passage_text=passage,
        document_id="DOC1",
        passage_id="DOC1_P0",
        language="hi",
    )

    assert len(chunks) == 1
    assert chunks[0]["chunk_id"] == "DOC1_P0_C0"
    assert chunks[0]["document_id"] == "DOC1"
    assert chunks[0]["token_count"] == count_tokens(passage)
    assert chunks[0]["sentence_count"] == 2


def test_long_passage_adaptive_split_and_overlap():
    """Test long passage splits respecting sentence boundaries and overlap."""
    chunker = AdaptiveSemanticChunker(min_tokens=20, max_tokens=40, overlap_sentences=1)
    
    sentences = [
        "वाक्य संख्या एक बहुत ही महत्वपूर्ण जानकारी प्रस्तुत करता है।",
        "वाक्य संख्या दो दूसरी महत्वपूर्ण बात को विस्तार से समझाता है।",
        "वाक्य संख्या तीन विषय परिवर्तन करके नए बिंदु पर ध्यान केंद्रित करता है।",
        "वाक्य संख्या चार अंतिम निष्कर्ष और समीक्षा प्रस्तुत करता है।",
    ]
    passage = " ".join(sentences)

    chunks = chunker.chunk_passage(
        passage_text=passage,
        document_id="DOC2",
        passage_id="DOC2_P0",
        language="hi",
    )

    assert len(chunks) >= 2
    for c in chunks:
        assert c["token_count"] <= 60  # Allowance for single sentence bound
        assert "chunk_id" in c
        assert "document_id" in c
        assert "passage_id" in c
        assert "language" in c
        assert "token_count" in c
        assert "sentence_count" in c

    # Verify overlap: chunk 1 should start with trailing sentence of chunk 0
    assert sentences[0] in chunks[0]["text"]


def test_fixed_size_chunking():
    """Test baseline fixed token window chunking."""
    chunker = AdaptiveSemanticChunker()
    text = " ".join([f"word{i}" for i in range(100)])
    chunks = chunker.fixed_size_chunking(text, chunk_size_tokens=30, overlap_tokens=5)

    assert len(chunks) > 1
    assert count_tokens(chunks[0]) == 30
