# Guardrails, Safety & Pipeline Harness Architecture

## Overview
This document specifies the guardrail policies, prompt injection defense, retrieval confidence checks, refusal rules, and 9-stage telemetry harness implemented in Phase 6 of the HH Goa Task 2 Voice RAG model.

---

## 1. Guardrail Policies

```text
Incoming Query / Audio
           ↓
[Input Query Guardrail]  ---> Checks: empty query, prompt injection, off-topic signals
           ↓
[Retrieval Confidence Guardrail] ---> Checks: top chunk similarity score >= 0.35
           ↓
[Output Grounding Guardrail] ---> Checks: answer text derived strictly from context
           ↓
Response Payload Output
```

### Policy 1: Empty & Invalid Query Check
- Empty audio payloads (< 10 bytes) raise `InvalidAudioError` (HTTP 400 Bad Request).
- Empty text queries return refusal response `guardrail_passed = False`.

### Policy 2: Prompt Injection Shielding
- Heuristic signals scanned: `"ignore previous instructions"`, `"disregard context"`, `"output system prompt"`, `"print secret key"`, `"bypass security"`.
- Action: Implements early refusal and marks retrieved text as **untrusted data**.

### Policy 3: Retrieval Confidence Thresholding
- If top-1 retrieved chunk similarity score < `0.35` (or 0 candidates retrieved), system refuses rather than hallucinates:
  `"I cannot answer this question based on the provided context."`

### Policy 4: Output Grounding Verification
- Validates that generated answers contain facts present in retrieved passages.

---

## 2. 9-Stage Pipeline Harness Telemetry

Every request executed through `RAGPipeline` tracks the following nanosecond-precision latency breakdown:

```json
{
  "latency": {
    "stt_ms": 12.5,
    "query_processing_ms": 1.2,
    "embedding_ms": 15.4,
    "retrieval_ms": 32.1,
    "reranking_ms": 0.0,
    "context_building_ms": 0.5,
    "generation_ms": 25.0,
    "guardrails_ms": 1.8,
    "total_ms": 88.5
  }
}
```

---

## 3. Execution & Validation Commands

```bash
# Execute 9 Voice & Guardrails Validation Scenarios
python backend/scripts/validate_voice_guardrails.py

# Query Voice API Endpoint via cURL (multipart audio upload)
curl -X POST "http://localhost:8000/api/voice/query" \
  -F "file=@sample_audio.wav" \
  -F "language_code=hi-IN" \
  -F "top_k=3"
```
