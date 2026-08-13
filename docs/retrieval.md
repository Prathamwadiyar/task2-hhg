# Multilingual Embedding, Vector Database Indexing & Retrieval Architecture

## Overview
This document specifies the multilingual embedding and Qdrant vector database layer implemented in Phase 4 of the HH Goa Task 2 Voice-Enabled RAG pipeline.

---

## 1. Multilingual Embedding Model (`intfloat/multilingual-e5-small`)

- **Model Identifier:** `intfloat/multilingual-e5-small`
- **Dense Vector Dimension:** 384
- **Distance Metric:** Cosine Similarity (`Distance.COSINE`)
- **Prefixing Conventions (E5 Standard):**
  - **Passage Indexing:** All document text chunks are prepended with `"passage: "` before generating embeddings.
  - **Search Query Encoding:** All user search queries are prepended with `"query: "` before generating dense query vectors.

---

## 2. Qdrant Vector Collection Specification (`msmarco_chunks`)

- **Collection Name:** `msmarco_chunks`
- **Vector Dimension:** 384
- **Idempotent Indexing Strategy:** Each vector point is assigned a deterministic UUID calculated via `uuid.uuid5(uuid.NAMESPACE_DNS, chunk_id)`. Re-running the indexing pipeline updates/overwrites vectors without producing duplicate entries.
- **Storage Engine:**
  - Standalone Qdrant Server (`http://localhost:6333`)
  - Local Persistent Disk Fallback (`./qdrant_data`)
  - In-Memory Mode (`:memory:`)

### Vector Point Payload Schema
```json
{
  "chunk_id": "MSMARCO-HIN_DEVA-1102432_P0_C0",
  "document_id": "MSMARCO-HIN_DEVA-1102432",
  "passage_id": "MSMARCO-HIN_DEVA-1102432_P0",
  "language": "hin_deva",
  "chunk_position": 0,
  "token_count": 82,
  "sentence_count": 4,
  "parent_id": "MSMARCO-HIN_DEVA-1102432_P0",
  "text": "एक कंपनी एक विशिष्ट देश में निगमित होती है...",
  "source_metadata": {
    "query_id": "1102432",
    "query_text_indic": "कॉरपोरेशन क्या है?",
    "answer_text_indic": "निगम एक कंपनी या लोगों का समूह होता है...",
    "is_selected": false,
    "url": "",
    "query_type": "DESCRIPTION"
  }
}
```

---

## 3. Multilingual Search Verification Test Results

### Query 1: English (`"What is a corporation?"`)
- **Top Match Score:** `0.8625`
- **Matched Chunk ID:** `MSMARCO-HIN_DEVA-1102432_P2_C0`
- **Language:** `hin_deva`
- **Snippet:** `"निगम की परिभाषा, व्यक्तियों का एक समूह, जो कानून द्वारा..."`

### Query 2: Hindi (`"कॉरपोरेशन क्या है?"`)
- **Top Match Score:** `0.8434`
- **Matched Chunk ID:** `MSMARCO-HIN_DEVA-1102432_P5_C0`
- **Language:** `hin_deva`
- **Snippet:** `"मैकडॉनल्ड कॉर्पोरेशन दुनिया के सबसे पहचानने योग्य निगमों में से एक है..."`

---

## 4. End-to-End Text-Based RAG Pipeline (Phase 5)

### Pipeline Sequence Flow
```text
POST /api/query (QueryRequest)
        ↓
DenseRetriever.retrieve_chunks()
  • Query Vectorization (multilingual-e5-small)
  • Qdrant Top-K Search (msmarco_chunks)
  • Deduplication & Min-Score Filtering (threshold=0.3)
        ↓
Citations.build_llm_context()
  • Structured Source Block Generation
        ↓
GroundedLLMGenerator.generate_answer()
  • Strict Grounding System Prompt
  • Zero-Hallucination & Refusal Logic
  • Prompt Injection Shielding
        ↓
RAGResponse Output (Answer + Sources + Latency Breakdown + Request ID)
```

---

## 5. Execution Commands & API Query Example

```bash
# Execute 5 RAG pipeline validation test scenarios
python backend/scripts/validate_rag.py

# Query text API endpoint via cURL
curl -X POST "http://localhost:8000/api/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is a corporation?", "language": "en", "top_k": 3}'
```

