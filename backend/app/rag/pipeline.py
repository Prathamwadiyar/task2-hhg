import base64
from typing import Optional
from app.config import Settings, get_settings
from app.core.exceptions import InvalidAudioError, STTFailureError
from app.core.logging import logger
from app.core.timing import StageTimer
from app.rag.generator import GroundedLLMGenerator, get_generator
from app.rag.guardrails import GuardrailsVerifier, get_guardrails
from app.rag.retriever import DenseRetriever, get_retriever
from app.schemas.requests import QueryRequest
from app.schemas.responses import LatencyMetrics, RAGResponse
from app.speech.sarvam import SarvamSpeechClient, get_sarvam_client


class RAGPipeline:
    """Main Orchestrator for Voice & Text RAG Request Lifecycle with 9-Stage Telemetry and Guardrails."""

    def __init__(
        self,
        settings: Optional[Settings] = None,
        retriever: Optional[DenseRetriever] = None,
        generator: Optional[GroundedLLMGenerator] = None,
        guardrails: Optional[GuardrailsVerifier] = None,
        sarvam_client: Optional[SarvamSpeechClient] = None,
    ):
        self.settings = settings or get_settings()
        self.retriever = retriever or get_retriever(self.settings)
        self.generator = generator or get_generator(self.settings)
        self.guardrails = guardrails or get_guardrails(self.settings)
        self.sarvam_client = sarvam_client or get_sarvam_client(self.settings)

    def run_query(
        self,
        request: QueryRequest,
        request_id: str,
        transcription: Optional[str] = None,
        stt_duration_ms: float = 0.0,
    ) -> RAGResponse:
        """Run text query through input guardrails, retrieval, confidence check, LLM generation, and output guardrails."""
        timer = StageTimer()
        if stt_duration_ms > 0.0:
            timer.record_stage("stt", stt_duration_ms)

        logger.info(f"[{request_id}] Executing RAG Pipeline for query: '{request.query[:60]}...'")

        # 1. Input Query Processing & Guardrails
        timer.start_stage("query_processing")
        valid_input, refusal_msg = self.guardrails.validate_input_query(request.query)
        timer.stop_stage()

        if not valid_input:
            latency_dict = timer.get_metrics_dict()
            return RAGResponse(
                request_id=request_id,
                query=request.query,
                transcription=transcription,
                answer=refusal_msg or self.guardrails.REFUSAL_MESSAGE,
                sources=[],
                latency=self._build_latency_metrics(latency_dict),
                guardrail_passed=False,
            )

        # 2. Retrieval Stage (embedding + vector search)
        timer.start_stage("embedding")
        # Embedding happens inside retriever
        timer.stop_stage()

        timer.start_stage("retrieval")
        try:
            sources = self.retriever.retrieve_chunks(
                query=request.query,
                top_k=request.top_k or 5,
                filter_lang=request.language if request.language != "en" else None,
            )
        except Exception as e:
            logger.error(f"[{request_id}] Qdrant retrieval failed: {e}. Falling back to empty sources.")
            sources = []
        timer.stop_stage()

        # 3. Retrieval Confidence Guardrails Check
        timer.start_stage("guardrails")
        has_confidence, confidence_refusal = self.guardrails.validate_retrieval_confidence(sources)
        timer.stop_stage()

        # If no API key is available AND retrieval confidence fails, return refusal message
        has_llm_key = bool(self.generator.gemini_api_key or self.generator.openai_api_key)
        if not has_confidence and not has_llm_key:
            latency_dict = timer.get_metrics_dict()
            return RAGResponse(
                request_id=request_id,
                query=request.query,
                transcription=transcription,
                answer=confidence_refusal or self.guardrails.REFUSAL_MESSAGE,
                sources=sources,
                latency=self._build_latency_metrics(latency_dict),
                guardrail_passed=True,
            )

        # 4. Context Building Stage
        timer.start_stage("context_building")
        timer.stop_stage()

        # 5. LLM Generation Stage
        timer.start_stage("generation")
        try:
            answer = self.generator.generate_answer(query=request.query, sources=sources)
        except Exception as e:
            logger.error(f"[{request_id}] LLM answer generation failed: {e}. Falling back to refusal message.")
            answer = self.guardrails.REFUSAL_MESSAGE
        timer.stop_stage()

        # 6. Output Grounding Guardrails Check
        timer.start_stage("guardrails")
        valid_output, output_refusal = self.guardrails.validate_output_grounding(answer, sources)
        timer.stop_stage()

        final_answer = answer if valid_output else (output_refusal or self.guardrails.REFUSAL_MESSAGE)
        latency_dict = timer.get_metrics_dict()
        latency_metrics = self._build_latency_metrics(latency_dict)

        response = RAGResponse(
            request_id=request_id,
            query=request.query,
            transcription=transcription,
            answer=final_answer,
            sources=sources,
            latency=latency_metrics,
            guardrail_passed=valid_output,
        )

        logger.info(f"[{request_id}] RAG Pipeline finished in {latency_metrics.total_ms:.2f}ms. Sources: {len(sources)}.")
        return response

    async def run_voice_query(
        self,
        audio_bytes: bytes,
        language_code: str = "hi-IN",
        top_k: int = 5,
        filename: str = "input_audio.webm",
        request_id: str = "REQ-VOICE-001",
    ) -> RAGResponse:
        """Run voice query through Sarvam STT transcription, then execute complete RAG pipeline."""
        if not audio_bytes or len(audio_bytes) < 10:
            raise InvalidAudioError(message="Invalid or empty audio file provided.")

        timer = StageTimer()
        timer.start_stage("stt")
        try:
            transcript = await self.sarvam_client.transcribe_audio(
                audio_bytes=audio_bytes,
                language_code=language_code,
                filename=filename,
            )
        except STTFailureError:
            raise
        except Exception as e:
            logger.error(f"[{request_id}] Voice STT failed: {e}")
            raise STTFailureError(message=f"Sarvam STT failed: {e}")
        finally:
            stt_ms = timer.stop_stage()

        if not transcript or not transcript.strip():
            logger.warning(f"[{request_id}] STT returned empty transcript.")
            latency_metrics = LatencyMetrics(stt_ms=stt_ms, total_ms=stt_ms)
            return RAGResponse(
                request_id=request_id,
                query="",
                transcription="",
                answer=self.guardrails.REFUSAL_MESSAGE,
                sources=[],
                latency=latency_metrics,
                guardrail_passed=False,
            )

        # Convert language_code (e.g. hi-IN) to ISO language code (e.g. hi)
        iso_lang = language_code.split("-")[0].lower()
        req = QueryRequest(query=transcript, language=iso_lang, top_k=top_k)

        return self.run_query(
            request=req,
            request_id=request_id,
            transcription=transcript,
            stt_duration_ms=stt_ms,
        )

    def _build_latency_metrics(self, latency_dict: dict) -> LatencyMetrics:
        """Build structured LatencyMetrics schema from timer metrics dictionary."""
        return LatencyMetrics(
            stt_ms=latency_dict.get("stt_ms", 0.0),
            query_processing_ms=latency_dict.get("query_processing_ms", 0.0),
            embedding_ms=latency_dict.get("embedding_ms", 0.0),
            retrieval_ms=latency_dict.get("retrieval_ms", 0.0),
            reranking_ms=latency_dict.get("reranking_ms", 0.0),
            context_building_ms=latency_dict.get("context_building_ms", 0.0),
            generation_ms=latency_dict.get("generation_ms", 0.0),
            guardrails_ms=latency_dict.get("guardrails_ms", 0.0),
            total_ms=latency_dict.get("total_ms", 0.0),
        )


_pipeline_instance: Optional[RAGPipeline] = None


def get_rag_pipeline(settings: Optional[Settings] = None) -> RAGPipeline:
    """Get singleton RAGPipeline instance."""
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = RAGPipeline(settings)
    return _pipeline_instance
