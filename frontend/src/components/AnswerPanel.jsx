import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { cleanMarkdownToProse } from '../services/api';

export function AnswerPanel({ result, onExplain }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (result && panelRef.current) {
      gsap.fromTo(panelRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
    }
  }, [result]);

  if (!result) return null;

  const { answer, transcription, guardrail_passed, sources, latency, request_id } = result;
  const sourceCount = sources?.length || 0;
  const totalMs = latency?.total_ms || 0;
  const isGrounded = guardrail_passed !== false;
  const cleanedAnswer = cleanMarkdownToProse(answer);
  const paragraphs = cleanedAnswer ? cleanedAnswer.split('\n\n') : [];

  return (
    <section className="section section-dark" ref={panelRef}>
      <div className="container">
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>

          {/* Transcript */}
          {transcription && (
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="text-label">TRANSCRIPTION</span>
              <p style={{ marginTop: '0.35rem', fontSize: '1.15rem', color: 'var(--hh-black)', fontWeight: 600, fontStyle: 'italic', fontFamily: 'var(--font-mono)' }}>
                "{transcription}"
              </p>
            </div>
          )}

          {/* Neo-Brutalist Answer Card */}
          <div className="card-brutalist" style={{ borderLeft: `6px solid ${isGrounded ? 'var(--status-success)' : 'var(--status-warning)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span className="text-label" style={{ fontSize: '12px' }}>GENERATED ANSWER</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className={`badge ${isGrounded ? 'badge-success' : 'badge-warning'}`}>
                  {isGrounded ? '✓ GROUNDED' : '⚠ LOW CONFIDENCE'}
                </span>
                <span className="badge badge-yellow">{sourceCount} SOURCE{sourceCount !== 1 ? 'S' : ''}</span>
                <span className="badge badge-pink">
                  {totalMs.toFixed(1)}ms
                </span>
              </div>
            </div>

            <div style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--hh-black)', fontWeight: 500 }}>
              {paragraphs.map((para, idx) => (
                <p key={idx} style={{ marginBottom: idx < paragraphs.length - 1 ? '1.1rem' : 0 }}>
                  {para}
                </p>
              ))}
            </div>

            {request_id && (
              <div className="text-mono" style={{ marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '11px', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                REQUEST ID: {request_id}
              </div>
            )}
          </div>

          {/* Guardrail state */}
          <div style={{ marginTop: '1.5rem' }}>
            {isGrounded ? (
              <div style={{ padding: '0.85rem 1.25rem', background: '#dcfce7', border: '2px solid #16a34a', color: '#15803d', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700 }}>
                ✓ CONTEXT VERIFIED &nbsp;·&nbsp; ✓ SOURCES SUPPORTED &nbsp;·&nbsp; ✓ RESPONSE GROUNDED
              </div>
            ) : (
              <div style={{ padding: '0.85rem 1.25rem', background: '#fef3c7', border: '2px solid #d97706', color: '#b45309', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700 }}>
                ⚠ INSUFFICIENT EVIDENCE &nbsp;·&nbsp; Relying on General Knowledge Fallback
              </div>
            )}
          </div>

          {/* Post-RAG Process Breakdown Callout Banner */}
          <div style={{
            marginTop: '1.75rem',
            background: 'linear-gradient(135deg, #073d22 0%, #0b6839 100%)',
            border: '2.5px solid #000000',
            boxShadow: '6px 6px 0px #000000',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ color: 'var(--hh-yellow)', fontSize: '1.1rem' }}>✦</span>
                <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--hh-yellow)', fontSize: '1.3rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  UNDERSTAND HOW THIS WAS GENERATED
                </span>
                <span className="badge badge-pink" style={{ fontSize: '9px', padding: '0.1rem 0.4rem' }}>INTERACTIVE</span>
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#e2e8f0', marginTop: '0.3rem', maxWidth: '520px' }}>
                Explore the step-by-step visual flowchart showing how your query was transcribed, embedded, retrieved from Qdrant, and synthesized.
              </p>
            </div>

            <button
              className="btn-primary"
              onClick={onExplain}
              style={{
                background: 'var(--hh-yellow)',
                color: '#000000',
                fontSize: '12px',
                padding: '0.7rem 1.4rem',
                boxShadow: '3px 3px 0px #000000',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 800,
              }}
            >
              <span>EXPLAIN PROCESS</span>
              <span>→</span>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
