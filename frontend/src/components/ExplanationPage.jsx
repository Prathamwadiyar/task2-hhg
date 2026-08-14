import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PIPELINE_STAGES = [
  {
    step: '01',
    title: 'Voice Input & Sarvam STT',
    subtitle: 'High-Precision Speech-to-Text for Indic Languages',
    badge: 'STAGE 1 · AUDIO TRANSCRIPTION',
    badgeColor: 'badge-pink',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
      </svg>
    ),
    description:
      'When you speak into the microphone, audio is captured as compressed WebM/WAV streams and transmitted to Sarvam AI\'s `saarika:v2.5` model. It transcribes regional Indian accents and dialects with phoneme-level precision across Indian English, Hindi, Kannada, and Marathi.',
    specs: [
      { label: 'Model', value: 'Sarvam AI saarika:v2.5' },
      { label: 'Supported Languages', value: 'en-IN, hi-IN, kn-IN, mr-IN' },
      { label: 'Audio Formats', value: 'WebM, WAV, MP3 (16kHz mono)' },
      { label: 'Average STT Time', value: '~250ms - 450ms' },
    ],
    flow: ['Microphone Audio (WebM)', '→', 'Sarvam REST API', '→', 'Clean Text Transcript'],
  },
  {
    step: '02',
    title: 'Input Guardrails & Screening',
    subtitle: 'Adversarial Defense & Off-Topic Filtering',
    badge: 'STAGE 2 · SECURITY HARNESS',
    badgeColor: 'badge-warning',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    description:
      'Before querying the database, the raw transcript passes through an input security guardrail. The system checks for prompt injection attacks, jailbreak payloads, and malicious instruction overrides, ensuring system integrity before vector search execution.',
    specs: [
      { label: 'Firewall Checks', value: 'Injection, Jailbreak, Adversarial' },
      { label: 'Decision Logic', value: 'Pass / Sanitized Refusal' },
      { label: 'Execution Time', value: '< 1.5ms' },
      { label: 'Refusal Policy', value: 'Standardized Clean JSON' },
    ],
    flow: ['Transcript Text', '→', 'Regex & Semantic Filters', '→', 'Sanitized Safe Query'],
  },
  {
    step: '03',
    title: 'Multilingual Semantic Embedding',
    subtitle: 'Projecting Queries into 384-Dimensional Vector Space',
    badge: 'STAGE 3 · VECTOR EMBEDDING',
    badgeColor: 'badge-yellow',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    description:
      'The query is prefixed with `query: ` and converted into a dense 384-dimensional normalized floating-point embedding using `intfloat/multilingual-e5-small`. Hindi, Kannada, Marathi, and English sentences with the same semantic meaning land in closely clustered geometric coordinates.',
    specs: [
      { label: 'Embedding Model', value: 'intfloat/multilingual-e5-small' },
      { label: 'Vector Dimensions', value: '384 Floats (Normalized)' },
      { label: 'Prefix Standard', value: 'query: <text> / passage: <text>' },
      { label: 'Embedding Time', value: '~15ms - 35ms (LRU Cached <0.1ms)' },
    ],
    flow: ['Safe Query String', '→', 'E5 Tokenizer & Transformer', '→', '384d Dense Vector'],
  },
  {
    step: '04',
    title: 'Qdrant Vector Database Search',
    subtitle: 'HNSW Graph Cosine Similarity Retrieval',
    badge: 'STAGE 4 · VECTOR RETRIEVAL',
    badgeColor: 'badge-green',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    description:
      'Qdrant performs an approximate nearest neighbor (ANN) search across the pre-indexed AI4Bharat MSMARCO-XI dataset. Using HNSW (Hierarchical Navigable Small World) graphs with Cosine distance, it retrieves the Top-K most relevant passage chunks in under 15 milliseconds.',
    specs: [
      { label: 'Vector Engine', value: 'Qdrant Vector DB (Port 6333)' },
      { label: 'Index Architecture', value: 'HNSW Graph Index' },
      { label: 'Similarity Metric', value: 'Cosine Distance (-1 to +1)' },
      { label: 'Lookup Latency', value: '< 18ms (P50: ~12ms)' },
    ],
    flow: ['384d Query Vector', '→', 'HNSW Vector Traversal', '→', 'Top-K Ranked Passage Chunks'],
  },
  {
    step: '05',
    title: 'Adaptive Semantic Chunking & Assembly',
    subtitle: 'Boundary-Aware Context Construction with Overlap',
    badge: 'STAGE 5 · CONTEXT SYNTHESIS',
    badgeColor: 'badge-pink',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    ),
    description:
      'Rather than using naive fixed-character splits, our pipeline utilizes Adaptive Semantic Chunking. Sentences are chunked along natural linguistic boundaries with 20% contextual overlap and rich metadata (passage IDs, language tags, query types), ensuring no crucial information is lost.',
    specs: [
      { label: 'Chunking Strategy', value: 'Adaptive Sentence Boundary Aware' },
      { label: 'Target Chunk Size', value: '150 - 250 Tokens' },
      { label: 'Sliding Overlap', value: '30 - 50 Tokens' },
      { label: 'Deduplication', value: 'MD5 Hash & Document Idempotency' },
    ],
    flow: ['Raw Documents', '→', 'Semantic Sentence Splitting', '→', 'Grounded Context Window'],
  },
  {
    step: '06',
    title: 'Grounded LLM Generation & Citations',
    subtitle: 'Strictly Grounded Synthesis via Google Gemini LLM',
    badge: 'STAGE 6 · ANSWER GENERATION',
    badgeColor: 'badge-yellow',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    description:
      'The assembled context and user query are passed to Google Gemini 1.5 Flash through an orchestration harness. The prompt instructions enforce strict factual grounding: the model must answer solely using provided passage context and must attribute sources with bracketed citations.',
    specs: [
      { label: 'LLM Model', value: 'Google Gemini 1.5 Flash' },
      { label: 'Temperature', value: '0.2 (High Determinism)' },
      { label: 'Hallucination Policy', value: 'Strict Fallback Refusal' },
      { label: 'Citation Linking', value: 'Direct Document & Chunk Attribution' },
    ],
    flow: ['Prompt + Retrieved Context', '→', 'Gemini Reasoning Engine', '→', 'Grounded Answer + Citations'],
  },
  {
    step: '07',
    title: 'Output Guardrails & Latency Telemetry',
    subtitle: 'Confidence Verification & 9-Stage Timing Aggregation',
    badge: 'STAGE 7 · TELEMETRY & VERIFICATION',
    badgeColor: 'badge-green',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    description:
      'The generated answer undergoes a final grounding verification check. If the LLM lacks supporting evidence, it outputs a graceful refusal rather than hallucinating. Concurrently, the nanosecond-precision StageTimer compiles latency for all 9 stages to stream live telemetry metrics.',
    specs: [
      { label: 'Groundedness Verifier', value: 'Context Claim Overlap Check' },
      { label: 'Timer Precision', value: 'Nanosecond Resolution (perf_counter)' },
      { label: 'Telemetry Dimensions', value: '9 Individual Pipeline Stages' },
      { label: 'Confidence Score Cutoff', value: 'Cosine Similarity >= 0.35' },
    ],
    flow: ['Generated Response', '→', 'Groundedness Verifier', '→', 'Final Output + Live Telemetry'],
  },
];

export function ExplanationPage({ onBack, currentResult }) {
  const pageRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });

    const ctx = gsap.context(() => {
      // Light hero entrance animation
      gsap.from('.expl-hero-anim', {
        y: 22,
        opacity: 0,
        stagger: 0.08,
        duration: 0.7,
        ease: 'power2.out',
      });

      // Flowchart nodes smooth stagger
      gsap.from('.flow-node', {
        scale: 0.94,
        y: 15,
        opacity: 0,
        stagger: 0.06,
        duration: 0.55,
        ease: 'power2.out',
        delay: 0.25,
      });

      // Step cards lighter scroll-reveal animation
      cardsRef.current.forEach((card) => {
        if (!card) return;
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
          y: 25,
          opacity: 0,
          duration: 0.65,
          ease: 'power2.out',
        });
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} style={{ minHeight: '100vh', paddingBottom: '5rem', position: 'relative' }}>
      
      {/* Top Floating Sticky Header with Back Button */}
      <div style={{
        position: 'sticky',
        top: '64px',
        zIndex: 90,
        background: 'rgba(255, 251, 235, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '2px solid #000000',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        padding: '0.75rem 0',
        transition: 'all 0.3s ease',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button
            className="btn-primary"
            onClick={onBack}
            style={{
              padding: '0.5rem 1.35rem',
              fontSize: '12px',
              gap: '0.4rem',
              background: 'var(--hh-yellow)',
              color: '#000',
              fontWeight: 800,
              boxShadow: '3px 3px 0px #000',
            }}
          >
            ← BACK TO LIVE VOICE RAG
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-pink" style={{ fontSize: '11px', fontWeight: 800 }}>HH GOA 2026</span>
            <span className="badge badge-yellow" style={{ fontSize: '11px', fontWeight: 800 }}>ARCHITECTURE EXPLAINER</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '1.25rem', maxWidth: '1040px' }}>
        
        {/* Main Title & Header */}
        <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto 1.5rem' }}>
          <div className="expl-hero-anim" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--hh-pink)',
              background: 'var(--hh-pink-dim)',
              border: '2px solid var(--hh-pink)',
              padding: '0.35rem 1rem',
              borderRadius: '999px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              boxShadow: '2px 2px 0px var(--hh-pink)',
            }}>
              VOICE RAG SYSTEM ARCHITECTURE
            </span>
          </div>

          <h1 className="expl-hero-anim heading-section" style={{ fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)', lineHeight: 1.1, marginBottom: '0.5rem' }}>
            HOW THE <span style={{ color: 'var(--hh-green)' }}>VOICE RAG ENGINE</span> WORKS
          </h1>

          <p className="expl-hero-anim" style={{
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(0.92rem, 1.8vw, 1.05rem)',
            marginTop: '0.5rem',
            lineHeight: 1.6,
            maxWidth: '720px',
            margin: '0.5rem auto 0',
          }}>
            A complete visual breakdown of real-time Indic speech-to-text, dense vector similarity search, adaptive semantic chunking, and grounded LLM synthesis.
          </p>
        </div>

        {/* Live Query Inspection Card (If redirected from a recent RAG execution) */}
        {currentResult && (
          <div className="card-brutalist expl-hero-anim" style={{
            maxWidth: '1000px',
            margin: '0 auto 1.5rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #fffbe8 100%)',
            borderLeft: '8px solid var(--hh-pink)',
            padding: '1.5rem',
            borderRadius: '12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <span className="text-label" style={{ color: 'var(--hh-pink)', fontSize: '12px', fontWeight: 800 }}>
                LIVE RUNTIME INSPECTION (LAST EXECUTED QUERY)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className="badge badge-success" style={{ fontSize: '10px' }}>✓ 9-STAGE TELEMETRY READY</span>
                <span className="badge badge-pink" style={{ fontSize: '10px' }}>{currentResult.latency?.total_ms?.toFixed(1) || '0'}ms TOTAL</span>
              </div>
            </div>

            <div style={{ background: 'var(--hh-offwhite)', padding: '1rem 1.25rem', border: '2px solid #000', borderRadius: '6px', marginBottom: '1.25rem' }}>
              <div className="text-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>QUERY PROCESSED:</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--hh-black)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                "{currentResult.transcription || currentResult.query}"
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', background: '#fff', border: '2px solid #000', borderRadius: '6px', boxShadow: '2px 2px 0px #000' }}>
                <div className="text-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>STT LATENCY</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--hh-pink)' }}>
                  {currentResult.latency?.stt_ms?.toFixed(1) || '0.0'}ms
                </div>
              </div>
              <div style={{ padding: '0.85rem', background: '#fff', border: '2px solid #000', borderRadius: '6px', boxShadow: '2px 2px 0px #000' }}>
                <div className="text-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>EMBED + RETRIEVAL</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--hh-green)' }}>
                  {((currentResult.latency?.embedding_ms || 0) + (currentResult.latency?.retrieval_ms || 0)).toFixed(1)}ms
                </div>
              </div>
              <div style={{ padding: '0.85rem', background: '#fff', border: '2px solid #000', borderRadius: '6px', boxShadow: '2px 2px 0px #000' }}>
                <div className="text-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SOURCES FETCHED</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--hh-black)' }}>
                  {currentResult.sources?.length || 0} Chunks
                </div>
              </div>
              <div style={{ padding: '0.85rem', background: '#fff', border: '2px solid #000', borderRadius: '6px', boxShadow: '2px 2px 0px #000' }}>
                <div className="text-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>GROUNDING STATUS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: currentResult.guardrail_passed !== false ? '#15803d' : '#b45309' }}>
                  {currentResult.guardrail_passed !== false ? '✓ VERIFIED' : '⚠ FALLBACK'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Master End-to-End Visual Architecture Pipeline Diagram */}
        <div className="card-brutalist" style={{
          maxWidth: '1000px',
          margin: '0 auto 2.5rem',
          background: '#ffffff',
          padding: '2.5rem 2rem',
          borderRadius: '16px',
          border: '3px solid #000000',
          boxShadow: '6px 6px 0px #000000',
          position: 'relative',
          zIndex: 10,
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--hh-pink)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '0.35rem',
            }}>
              INTERACTIVE ARCHITECTURE BLUEPRINT
            </span>
            <h2 className="heading-card" style={{ fontSize: '2rem', color: '#000000', fontWeight: 900, textTransform: 'uppercase' }}>
              END-TO-END SYSTEM DATA FLOW
            </h2>
          </div>

          {/* Clean, perfectly-aligned responsive flow pipeline */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            justifyContent: 'center',
            alignItems: 'stretch',
          }}>
            {[
              { title: '1. Audio Capture', tag: 'WebM / WAV (Mic)', bg: 'var(--hh-yellow)', color: '#000' },
              { title: '2. Sarvam STT', tag: 'saarika:v2.5', bg: 'var(--hh-pink)', color: '#fff' },
              { title: '3. Guardrails', tag: 'Safety Harness', bg: '#fef3c7', color: '#000' },
              { title: '4. Multilingual E5', tag: '384d Vector', bg: 'var(--hh-yellow)', color: '#000' },
              { title: '5. Qdrant DB', tag: 'HNSW Search', bg: 'var(--hh-green)', color: '#fff' },
              { title: '6. Gemini LLM', tag: 'Grounded RAG', bg: '#e0e7ff', color: '#000' },
              { title: '7. Output & Metrics', tag: 'Citations + 9 Stages', bg: '#dcfce7', color: '#000' },
            ].map((node, i) => (
              <React.Fragment key={i}>
                <div
                  className="flow-node"
                  style={{
                    flex: '1 1 125px',
                    minWidth: '120px',
                    maxWidth: '145px',
                    background: node.bg,
                    color: node.color,
                    border: '2px solid #000',
                    boxShadow: '3px 3px 0px #000',
                    padding: '0.9rem 0.6rem',
                    textAlign: 'center',
                    borderRadius: '8px',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '5px 5px 0px #000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.boxShadow = '3px 3px 0px #000';
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.2 }}>
                    {node.title}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, marginTop: '0.35rem', opacity: 0.9 }}>
                    {node.tag}
                  </div>
                </div>

                {i < 6 && (
                  <div className="flow-arrow" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '14px',
                    fontWeight: 900,
                    color: 'var(--hh-pink)',
                    userSelect: 'none',
                  }}>
                    →
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="text-mono" style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#000000',
            fontWeight: 600,
            marginTop: '1.75rem',
            paddingTop: '1rem',
            borderTop: '2px solid #000000',
          }}>
            ⚡ Average Latency: <strong style={{ color: 'var(--hh-pink)' }}>&lt; 50ms</strong> (Retrieval + Vector Match) | <strong style={{ color: 'var(--hh-pink)' }}>&lt; 600ms</strong> (Full Voice STT + LLM Synthesis)
          </div>
        </div>

        {/* The 7 Deep-Dive Step Cards */}
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
          {PIPELINE_STAGES.map((stage, idx) => (
            <div
              key={stage.step}
              ref={(el) => (cardsRef.current[idx] = el)}
              className="card-brutalist"
              style={{
                background: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                padding: '2.25rem 2rem',
                borderRadius: '14px',
                border: '2.5px solid #000',
                borderLeft: `8px solid ${idx % 2 === 0 ? 'var(--hh-green)' : 'var(--hh-pink)'}`,
                boxShadow: '5px 5px 0px #000',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '7px 7px 0px #000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = '5px 5px 0px #000';
              }}
            >
              {/* Step Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    background: idx % 2 === 0 ? 'var(--hh-yellow)' : 'var(--hh-pink)',
                    color: idx % 2 === 0 ? '#000' : '#fff',
                    border: '2px solid #000',
                    boxShadow: '3px 3px 0px #000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    flexShrink: 0,
                  }}>
                    {stage.icon}
                  </div>
                  <div>
                    <span className="text-mono" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--hh-pink)' }}>
                      STAGE {stage.step} OF 07
                    </span>
                    <h3 className="heading-card" style={{ fontSize: '1.6rem', marginTop: '0.1rem', color: 'var(--hh-black)' }}>
                      {stage.title}
                    </h3>
                  </div>
                </div>

                <span className={`badge ${stage.badgeColor}`} style={{ fontSize: '11px', fontWeight: 800 }}>
                  {stage.badge}
                </span>
              </div>

              {/* Subtitle & Description */}
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--hh-green)', marginBottom: '0.75rem' }}>
                {stage.subtitle}
              </div>

              <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#2d3748', marginBottom: '1.5rem' }}>
                {stage.description}
              </p>

              {/* Data Flow Diagram Pill */}
              <div style={{
                background: 'var(--hh-offwhite)',
                border: '1.5px solid #000',
                padding: '0.85rem 1.25rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                flexWrap: 'wrap',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '1.5rem',
                boxShadow: '2px 2px 0px #000',
              }}>
                <span style={{ color: 'var(--hh-pink)' }}>DATA FLOW:</span>
                {stage.flow.map((f, fi) => (
                  <span key={fi} style={{ color: f === '→' ? 'var(--hh-pink)' : '#000' }}>
                    {f}
                  </span>
                ))}
              </div>

              {/* Specs Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                borderTop: '1.5px solid var(--border-subtle)',
                paddingTop: '1.25rem',
              }}>
                {stage.specs.map((spec, si) => (
                  <div key={si} style={{ background: '#f8fafc', padding: '0.7rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '6px' }}>
                    <div className="text-mono" style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                      {spec.label}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                      {spec.value}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>

        {/* Bottom CTA to Return to Main Voice RAG */}
        <div style={{ textAlign: 'center', marginTop: '4.5rem' }}>
          <div className="card-brutalist" style={{
            maxWidth: '680px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, #073d22 0%, #0b6839 100%)',
            color: '#fff',
            padding: '2.5rem 2rem',
            borderRadius: '16px',
            border: '2.5px solid #000',
            boxShadow: '6px 6px 0px #000',
          }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', color: 'var(--hh-yellow)', textTransform: 'uppercase' }}>
              READY TO TEST THE ENGINE?
            </h3>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', margin: '0.75rem auto 1.75rem', color: '#e2e8f0', maxWidth: '480px' }}>
              Ask a question via microphone or text search and watch all 7 stages execute live with real-time telemetry.
            </p>
            <button
              className="btn-primary"
              onClick={onBack}
              style={{
                background: 'var(--hh-yellow)',
                color: '#000',
                fontSize: '14px',
                padding: '0.9rem 2.2rem',
                boxShadow: '3px 3px 0px #000',
                fontWeight: 800,
              }}
            >
              🚀 LAUNCH VOICE RAG NOW →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
