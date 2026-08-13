# Voice-Enabled Multilingual RAG Model (HH Goa 2026 Task 2)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://react.dev/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Latest-DC2626?logo=qdrant)](https://qdrant.tech/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A production-quality Voice-Enabled Retrieval-Augmented Generation (RAG) system built for Indic languages and English using **Sarvam AI STT**, **AI4Bharat MSMARCO-XI dataset**, **Multilingual E5 Embeddings**, **Qdrant Vector DB**, **FastAPI**, and **React**.

---

## 📌 Project Status (Phase 1 of 8 Complete)

- ✅ **Monorepo Foundation:** Modular structure separating FastAPI backend and React frontend.
- ✅ **Centralized Config:** Strongly typed environment configuration with Pydantic.
- ✅ **Latency Telemetry Engine:** Nanosecond-precision multi-stage latency timer tracking all pipeline steps.
- ✅ **Request ID & Structured Logging:** Request ID tracking (`REQ-YYYYMMDD-HHMMSS-<uuid>`) with clean JSON logs.
- ✅ **Global Exception Handling:** Custom error hierarchy returning clean JSON responses without exposing internal tracebacks.
- ✅ **Vector Database Abstraction:** Qdrant client connection and health management.
- ✅ **Frontend Shell:** React UI with live system health monitoring and backend API service layer.
- ✅ **Dataset Pipeline (Phase 2):** Configurable downloader & streaming JSONL preprocessor for `AI4Bharat/MSMARCO-XI`.
- ✅ **Adaptive Semantic Chunking (Phase 3):** Sentence boundary-aware chunking with n-gram cosine similarity, sentence overlap, and rich metadata.
- ✅ **Multilingual Embedding & Vector Indexing (Phase 4):** Batched `intfloat/multilingual-e5-small` embeddings and idempotent Qdrant vector database storage.
- ✅ **Grounded Text-Based RAG Pipeline (Phase 5):** Context-grounded LLM answer generator, citations builder, prompt injection protection, and functional `POST /api/query` API endpoint.
- ✅ **Voice STT & Guardrails Harness (Phase 6):** Sarvam AI Speech-to-Text integration (`POST /api/voice/query`), 9-stage latency telemetry, input query guardrails, retrieval confidence checks, and output grounding verification.
- ✅ **Benchmarking & Latency Analytics (Phase 7):** P50/P70/P100 latency percentiles, Information Retrieval metrics (Recall@5, Recall@10, MRR), Fixed vs Adaptive chunking comparison, and `python backend/scripts/benchmark.py`.
- ⏳ **Upcoming Phase:** Final Frontend UI Polishing, Deployment & Submission Readiness (Phase 8).

---

## 📊 Ingestion, Vector Indexing, RAG & Benchmark Pipeline (Phases 2-7)

Download, preprocess, chunk, index, query text, process voice queries, and run latency benchmarks:

```bash
# 1. Download language subset (e.g. Hindi validation)
python backend/scripts/download_dataset.py --language hin --split validation --output-dir data/raw

# 2. Preprocess, clean text, and extract metadata
python backend/scripts/preprocess.py --language hin --split validation --limit 1000 --output data/processed/msmarco_hin_val_1k.jsonl

# 3. Execute Adaptive Semantic Chunking
python backend/scripts/build_chunks.py --input data/processed/msmarco_hin_val_1k.jsonl --output data/chunks/msmarco_chunks_hin_val_1k.jsonl

# 4. Generate Multilingual E5 Embeddings & Index into Qdrant Vector DB
python backend/scripts/build_index.py --chunks-file data/chunks/msmarco_chunks_hin_val_1k.jsonl --collection msmarco_chunks --batch-size 64

# 5. Run Voice RAG & Guardrails Validation Suite (9 Scenarios)
python backend/scripts/validate_voice_guardrails.py

# 6. Run Latency Percentiles & Retrieval Metrics Benchmark Suite
python backend/scripts/benchmark.py
```

---

## 🏗️ Monorepo Architecture

```
hhgoa-voice-rag/
├── backend/
│   ├── app/
│   │   ├── api/               # REST API endpoints (/health, /api/query, /api/voice/query)
│   │   ├── core/              # Latency timer, logging, exception handler
│   │   ├── database/          # Qdrant DB manager
│   │   ├── rag/               # Chunker, embedder, retriever, generator, guardrails
│   │   ├── speech/            # Sarvam STT integration
│   │   ├── analytics/         # Latency aggregation and metrics
│   │   └── schemas/           # Pydantic Request/Response models
│   ├── scripts/               # Preprocessing, indexing, and benchmark scripts
│   ├── tests/                 # Pytest suite
│   ├── requirements.txt       # Backend dependencies
│   └── .env.example           # Environment variables template
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── services/          # API service layer (api.js)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── App.jsx            # Application shell
│   │   └── main.jsx           # Entry point
│   └── package.json
├── data/                      # Dataset and index storage
├── docs/                      # Technical specifications & architecture diagrams
├── docker-compose.yml         # Qdrant Vector DB container configuration
└── README.md
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python:** 3.11 or higher
- **Node.js:** v18 or higher (v24 recommended)
- **Docker / Docker Desktop:** Optional (Required for running local Qdrant container)

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables configuration
cp .env.example .env

# Run FastAPI development server
uvicorn app.main:app --reload --port 8000
```

Backend will be accessible at:
- **API Server:** `http://localhost:8000`
- **Health Endpoint:** `http://localhost:8000/health`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`

---

### 2. Qdrant Setup (Docker)

```bash
# From repository root
docker-compose up -d
```
Qdrant Web UI / Dashboard will be accessible at `http://localhost:6333/dashboard`.

---

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Copy environment template
cp .env.example .env

# Start React development server
npm run dev
```

Frontend will be accessible at `http://localhost:3000`.

---

## 🧪 Running Tests

Run backend unit tests with `pytest`:

```bash
# From backend directory
pytest tests/ -v
```

---

## 🔑 Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `SARVAM_API_KEY` | API Key for Sarvam Speech-to-Text | `""` |
| `QDRANT_URL` | Qdrant Vector DB Endpoint | `http://localhost:6333` |
| `QDRANT_API_KEY` | Qdrant API Key (if authenticated) | `""` |
| `QDRANT_COLLECTION` | Vector collection name | `msmarco_chunks` |
| `EMBEDDING_MODEL` | HuggingFace embedding model ID | `intfloat/multilingual-e5-small` |
| `LLM_API_KEY` | API Key for LLM generator | `""` |
| `LLM_MODEL` | Model ID for LLM generation | `gemini-1.5-flash` / `groq-llama3` |
| `FRONTEND_ORIGIN` | Allowed CORS origin for frontend | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level (`DEBUG`, `INFO`, `WARNING`) | `INFO` |

---

## 🛣️ Roadmap

- [x] **Phase 1:** Monorepo foundation, architecture, timing infrastructure, API skeleton, React frontend shell.
- [x] **Phase 2:** AI4Bharat MSMARCO-XI dataset ingestion & streaming preprocessing pipeline.
- [x] **Phase 3:** Advanced adaptive/semantic chunking pipeline and benchmark comparison.
- [ ] **Phase 4:** Multilingual E5 embeddings, Qdrant vector indexing, hybrid retrieval (Dense + BM25 RRF) & reranking.
- [ ] **Phase 5:** Grounded RAG answer generator with citation attribution.
- [ ] **Phase 6:** Sarvam AI STT voice pipeline integration.
- [ ] **Phase 7:** Guardrails, prompt injection protection, groundedness verifier.
- [ ] **Phase 8:** Comprehensive latency benchmarking, retrieval evaluation, final UI polish.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
