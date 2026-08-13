import React from 'react';

const FLOW_STAGES = [
  // Row 1: Left -> Right
  {
    row: 1,
    step: '01',
    key: 'voice',
    title: 'VOICE INPUT',
    tech: 'WEB AUDIO API',
    desc: 'Capture 16kHz PCM audio stream',
    iconPath: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3',
  },
  {
    step: '02',
    key: 'stt',
    title: 'SPEECH-TO-TEXT',
    tech: 'SARVAM AI',
    desc: 'Indic speech audio to text transcription',
    iconPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8',
  },
  {
    step: '03',
    key: 'query',
    title: 'QUERY VALIDATION',
    tech: 'GUARDRAILS v1',
    desc: 'Sanitize query & detect language ISO',
    iconPath: 'M21 21l-4.35-4.35 M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  },

  // Row 2: Right -> Left (S-Curve)
  {
    step: '04',
    key: 'embedding',
    title: 'VECTOR EMBEDDING',
    tech: 'MULTILINGUAL E5',
    desc: 'Encode query into 384d dense vector',
    iconPath: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
  },
  {
    step: '05',
    key: 'qdrant',
    title: 'QDRANT SEARCH',
    tech: 'QDRANT DB',
    desc: 'Cosine similarity Top-K search',
    iconPath: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  },
  {
    step: '06',
    key: 'ranking',
    title: 'CONTEXT RERANKING',
    tech: 'SCORE THRESHOLD',
    desc: 'Filter low scores & deduplicate chunks',
    iconPath: 'M12 20V10 M18 20V4 M6 20v-4',
  },

  // Row 3: Left -> Right
  {
    step: '07',
    key: 'rag',
    title: 'RAG GENERATION',
    tech: 'GOOGLE GEMINI',
    desc: 'Synthesize grounded LLM answer',
    iconPath: 'M12 2v4 M12 18v4 M4.93 4.93l2.83 2.83 M16.24 16.24l2.83 2.83 M2 12h4 M18 12h4 M4.93 19.07l2.83-2.83 M16.24 7.76l2.83-2.83',
  },
  {
    step: '08',
    key: 'guardrail',
    title: 'GROUNDING SAFETY',
    tech: 'HALLUCINATION GUARD',
    desc: 'Verify factuality against sources',
    iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  },
  {
    step: '09',
    key: 'answer',
    title: 'GROUNDED RESPONSE',
    tech: 'CITATIONS & STATS',
    desc: 'Final response with citations & telemetry',
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
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px', marginTop: '0.5rem', maxWidth: '560px', margin: '0.5rem auto 0' }}>
            Sequential end-to-end processing pipeline connected with live telemetry flow paths.
          </p>
        </div>

        {/* Interactive Flowchart Diagram Workspace */}
        <div style={{ maxWidth: '1050px', margin: '0 auto', position: 'relative' }}>
          
          {/* ROW 1: Stages 01 -> 02 -> 03 (Left to Right) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            {FLOW_STAGES.slice(0, 3).map((node, i) => (
              <React.Fragment key={node.key}>
                <FlowCard node={node} activeStage={activeStage} stageIndex={stageIndex} totalIdx={i} />
                {i < 2 && <ArrowHorizontal direction="right" />}
              </React.Fragment>
            ))}
          </div>

          {/* Right Curvy Arrow Connector (Row 1 -> Row 2) */}
          <div className="curvy-connector-right" style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 3rem 1rem 0' }}>
            <svg width="120" height="70" viewBox="0 0 120 70" fill="none">
              <path d="M 20 0 C 100 0, 100 70, 20 70" stroke="#000" strokeWidth="3" strokeDasharray="6 4" fill="none" />
              <polygon points="15,65 25,70 25,60" fill="#000" />
            </svg>
          </div>

          {/* ROW 2: Stages 06 <- 05 <- 04 (Right to Left / Reverse Flow) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <FlowCard node={FLOW_STAGES[3]} activeStage={activeStage} stageIndex={stageIndex} totalIdx={3} />
            <ArrowHorizontal direction="left" />
            <FlowCard node={FLOW_STAGES[4]} activeStage={activeStage} stageIndex={stageIndex} totalIdx={4} />
            <ArrowHorizontal direction="left" />
            <FlowCard node={FLOW_STAGES[5]} activeStage={activeStage} stageIndex={stageIndex} totalIdx={5} />
          </div>

          {/* Left Curvy Arrow Connector (Row 2 -> Row 3) */}
          <div className="curvy-connector-left" style={{ display: 'flex', justifyContent: 'flex-start', padding: '1rem 0 1rem 3rem' }}>
            <svg width="120" height="70" viewBox="0 0 120 70" fill="none">
              <path d="M 100 0 C 20 0, 20 70, 100 70" stroke="#000" strokeWidth="3" strokeDasharray="6 4" fill="none" />
              <polygon points="105,65 95,70 95,60" fill="#000" />
            </svg>
          </div>

          {/* ROW 3: Stages 07 -> 08 -> 09 (Left to Right) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            {FLOW_STAGES.slice(6, 9).map((node, i) => (
              <React.Fragment key={node.key}>
                <FlowCard node={node} activeStage={activeStage} stageIndex={stageIndex} totalIdx={i + 6} />
                {i < 2 && <ArrowHorizontal direction="right" />}
              </React.Fragment>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}

/* Individual Neo-Brutalist Flowchart Node Card */
function FlowCard({ node, activeStage, stageIndex, totalIdx }) {
  const isActive = node.key === activeStage;
  const isComplete = stageIndex > totalIdx;

  return (
    <div
      className="card-brutalist"
      style={{
        flex: '1 1 280px',
        maxWidth: '310px',
        padding: '1.25rem',
        background: isActive ? 'var(--hh-yellow)' : isComplete ? '#dcfce7' : 'var(--hh-white)',
        border: '2px solid #000',
        boxShadow: isActive ? '6px 6px 0px #000' : '4px 4px 0px #000',
        transition: 'all 0.2s ease',
        opacity: 1,
        visibility: 'visible',
      }}
    >
      {/* Header Badge Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 900,
            background: '#000',
            color: 'var(--hh-yellow)',
            padding: '0.15rem 0.5rem',
          }}>
            {node.step}
          </span>
          <span className="text-mono" style={{ fontSize: '10px', fontWeight: 800, color: 'var(--hh-pink)' }}>
            {node.tech}
          </span>
        </div>

        {isComplete && <span className="badge badge-success" style={{ fontSize: '9px' }}>✓ DONE</span>}
        {isActive && <span className="badge badge-pink" style={{ fontSize: '9px', animation: 'blink 1s infinite' }}>★ RUNNING</span>}
        {!isComplete && !isActive && <span className="badge" style={{ fontSize: '9px', background: 'var(--hh-gray-light)', color: '#000' }}>READY</span>}
      </div>

      {/* Main Title & Icon */}
      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
        <div style={{
          width: '38px',
          height: '38px',
          minWidth: '38px',
          background: isActive ? '#000' : 'var(--hh-yellow)',
          color: isActive ? 'var(--hh-yellow)' : '#000',
          border: '2px solid #000',
          boxShadow: '2px 2px 0px #000',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d={node.iconPath} />
          </svg>
        </div>

        <div>
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#000',
            textTransform: 'uppercase',
            lineHeight: 1.1,
            marginBottom: '0.25rem',
          }}>
            {node.title}
          </h3>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: 1.45,
          }}>
            {node.desc}
          </p>
        </div>
      </div>
    </div>
  );
}

/* Horizontal Flowchart Arrow Connector */
function ArrowHorizontal({ direction = 'right' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.25rem' }}>
      <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
        <line x1="0" y1="10" x2="30" y2="10" stroke="#000" strokeWidth="2.5" strokeDasharray="4 2" />
        {direction === 'right' ? (
          <polygon points="26,4 35,10 26,16" fill="#000" />
        ) : (
          <polygon points="10,4 1,10 10,16" fill="#000" />
        )}
      </svg>
    </div>
  );
}
