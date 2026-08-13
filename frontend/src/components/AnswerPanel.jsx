import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function AnswerPanel({ result }) {
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

            <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--hh-black)', fontWeight: 500 }}>
              {answer}
            </p>

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

        </div>
      </div>
    </section>
  );
}
