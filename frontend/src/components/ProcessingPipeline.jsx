import React from 'react';

const FLOW_STAGES = [
  {
    step: '01',
    key: 'voice',
    title: 'VOICE INPUT',
    tech: 'WEB AUDIO API',
    desc: 'Capture 16kHz PCM audio stream from user microphone',
    iconPath: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3',
  },
  {
    step: '02',
    key: 'stt',
    title: 'SPEECH-TO-TEXT',
    tech: 'SARVAM AI',
    desc: 'Indic speech audio to text transcription via saarika:v2.5',
    iconPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8',
  },
  {
    step: '03',
    key: 'query',
    title: 'QUERY VALIDATION',
    tech: 'GUARDRAILS v1',
    desc: 'Sanitize query, detect language ISO & verify security policies',
    iconPath: 'M21 21l-4.35-4.35 M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  },
  {
    step: '04',
    key: 'embedding',
    title: 'VECTOR EMBEDDING',
    tech: 'MULTILINGUAL E5',
    desc: 'Encode query into 384-dimensional dense semantic vector',
    iconPath: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
  },
  {
    step: '05',
    key: 'qdrant',
    title: 'QDRANT SEARCH',
    tech: 'QDRANT DB',
    desc: 'Cosine similarity Top-K HNSW index search across MS MARCO',
    iconPath: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  },
  {
    step: '06',
    key: 'ranking',
    title: 'CONTEXT RERANKING',
    tech: 'SCORE THRESHOLD',
    desc: 'Filter low scores, deduplicate chunks & order by relevance',
    iconPath: 'M12 20V10 M18 20V4 M6 20v-4',
  },
  {
    step: '07',
    key: 'rag',
    title: 'RAG GENERATION',
    tech: 'NVIDIA NEMOTRON',
    desc: 'Synthesize grounded LLM answer with strict citation constraints',
    iconPath: 'M12 2v4 M12 18v4 M4.93 4.93l2.83 2.83 M16.24 16.24l2.83 2.83 M2 12h4 M18 12h4 M4.93 19.07l2.83-2.83 M16.24 7.76l2.83-2.83',
  },
  {
    step: '08',
    key: 'guardrail',
    title: 'GROUNDING SAFETY',
    tech: 'HALLUCINATION GUARD',
    desc: 'Verify factuality against source passages & prevent hallucinations',
    iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  },
  {
    step: '09',
    key: 'answer',
    title: 'GROUNDED RESPONSE',
    tech: 'CITATIONS & STATS',
    desc: 'Final synthesized response with passage citations & latency telemetry',
    iconPath: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3',
  },
];

export function ProcessingPipeline({ activeStage }) {
  const stageIndex = FLOW_STAGES.findIndex((n) => n.key === activeStage);

  return (
    <section id="pipeline" className="section" style={{ background: 'var(--hh-white)', borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="text-label">SYSTEM ARCHITECTURE</span>
          <h2 className="heading-section" style={{ marginTop: '0.35rem' }}>
            STEP-BY-STEP <span style={{ color: 'var(--hh-green)' }}>RAG FLOWCHART</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px', marginTop: '0.5rem', maxWidth: '580px', margin: '0.5rem auto 0' }}>
            Sequential end-to-end processing pipeline connected with live telemetry flow paths.
          </p>
        </div>

        {/* Vertical Flowchart Pipeline Workspace */}
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {FLOW_STAGES.map((node, i) => (
            <React.Fragment key={node.key}>
              <FlowCard
                node={node}
                activeStage={activeStage}
                stageIndex={stageIndex}
                totalIdx={i}
              />
              {i < FLOW_STAGES.length - 1 && (
                <HandDrawnArrow index={i} />
              )}
            </React.Fragment>
          ))}
        </div>

      </div>
    </section>
  );
}

/* Individual Neo-Brutalist Vertical Flowchart Node Card */
function FlowCard({ node, activeStage, stageIndex, totalIdx }) {
  const isActive = node.key === activeStage;
  const isComplete = stageIndex > totalIdx;

  return (
    <div
      className="card-brutalist"
      style={{
        width: '100%',
        padding: '1.25rem 1.5rem',
        background: isActive ? 'var(--hh-yellow)' : isComplete ? '#dcfce7' : 'var(--hh-white)',
        border: '2.5px solid #000',
        boxShadow: isActive ? '6px 6px 0px #000' : '4px 4px 0px #000',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, background-color 0.2s ease',
        borderRadius: '6px',
        opacity: 1,
        visibility: 'visible',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '6px 6px 0px #000';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0px)';
        e.currentTarget.style.boxShadow = isActive ? '6px 6px 0px #000' : '4px 4px 0px #000';
      }}
    >
      {/* Header Badge Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 900,
            background: '#000',
            color: 'var(--hh-yellow)',
            padding: '0.15rem 0.55rem',
            border: '1px solid #000',
            borderRadius: '2px',
          }}>
            {node.step}
          </span>
          <span className="text-mono" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--hh-pink)', letterSpacing: '0.04em' }}>
            {node.tech}
          </span>
        </div>

        {isComplete && (
          <span className="badge badge-success" style={{ fontSize: '10px', padding: '0.2rem 0.6rem', border: '1.5px solid #000' }}>
            ✓ DONE
          </span>
        )}
        {isActive && (
          <span className="badge badge-pink" style={{ fontSize: '10px', padding: '0.2rem 0.6rem', border: '1.5px solid #000', animation: 'blink 1s infinite' }}>
            ★ RUNNING
          </span>
        )}
        {!isComplete && !isActive && (
          <span className="badge" style={{ fontSize: '10px', padding: '0.2rem 0.6rem', background: 'var(--hh-gray-light)', color: '#000', border: '1.5px solid #000' }}>
            READY
          </span>
        )}
      </div>

      {/* Main Title & Icon */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{
          width: '42px',
          height: '42px',
          minWidth: '42px',
          background: isActive ? '#000' : 'var(--hh-yellow)',
          color: isActive ? 'var(--hh-yellow)' : '#000',
          border: '2px solid #000',
          boxShadow: '2.5px 2.5px 0px #000',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d={node.iconPath} />
          </svg>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 900,
            color: '#000',
            textTransform: 'uppercase',
            lineHeight: 1.15,
            marginBottom: '0.2rem',
            letterSpacing: '0.02em',
          }}>
            {node.title}
          </h3>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
            color: 'var(--text-muted)',
            lineHeight: 1.45,
            margin: 0,
          }}>
            {node.desc}
          </p>
        </div>
      </div>
    </div>
  );
}

/* Hand-Drawn Minimalist Inked Downward Arrow matching user reference */
function HandDrawnArrow() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0.35rem 0',
      userSelect: 'none',
    }}>
      <svg width="26" height="46" viewBox="0 0 26 46" fill="none">
        <path d="M 13 3 L 13 40" stroke="#000000" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M 5 29 L 13 41 L 21 29" stroke="#000000" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}

export default ProcessingPipeline;
