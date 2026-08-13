import React from 'react';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--hh-yellow)', textTransform: 'uppercase' }}>
              HACKER HOUSE
            </span>
            <span style={{
              fontFamily: 'var(--font-devanagari)',
              background: 'var(--hh-pink)',
              color: '#ffffff',
              fontSize: '0.7rem',
              padding: '0.05rem 0.35rem',
              borderRadius: '999px',
              border: '2px solid #ffffff',
              fontWeight: 700,
            }}>
              गोवा
            </span>
          </div>
          <div className="text-mono" style={{ color: '#a0aec0', marginTop: '0.35rem', fontSize: '12px' }}>
            OFFICIAL DIGITAL ACTIVATION · GOA, INDIA 2026 · TASK 2
          </div>
        </div>

        <div className="text-mono" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <div className="text-label" style={{ color: 'var(--hh-yellow)', marginBottom: '0.3rem' }}>STACK</div>
            <div style={{ color: '#e2e8f0', fontSize: '12px' }}>
              FastAPI · React · Qdrant · Sarvam AI
            </div>
          </div>
          <div>
            <div className="text-label" style={{ color: 'var(--hh-yellow)', marginBottom: '0.3rem' }}>DATASETS</div>
            <div style={{ color: '#e2e8f0', fontSize: '12px' }}>
              MSMARCO-XI & Ultra-FineWeb-L3
            </div>
          </div>
          <div>
            <div className="text-label" style={{ color: 'var(--hh-yellow)', marginBottom: '0.3rem' }}>EMBEDDING</div>
            <div style={{ color: '#e2e8f0', fontSize: '12px' }}>
              multilingual-e5-small (384d)
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 'var(--container-max)', margin: '2rem auto 0', padding: '1.5rem clamp(1rem, 3vw, 2.5rem) 0', borderTop: '1px solid #333' }}>
        <div className="text-mono" style={{ color: '#a0aec0', fontSize: '11px', textAlign: 'center' }}>
          Built for Hacker House Goa 2026 Shortlisting Task 2 · Production Voice RAG Model
        </div>
      </div>
    </footer>
  );
}
