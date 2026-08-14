import React from 'react';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--hh-yellow)', textTransform: 'uppercase' }}>
              HACKER
            </span>
            <span style={{
              fontFamily: 'var(--font-devanagari)',
              color: 'var(--hh-pink)',
              fontSize: '1rem',
              fontWeight: 900,
              transform: 'rotate(-6deg)',
              display: 'inline-block',
              lineHeight: 1,
              textShadow: '-1px -1px 0 #fee101, 1px -1px 0 #fee101, -1px 1px 0 #fee101, 1px 1px 0 #fee101, 2px 2px 0px #000',
            }}>
              गोवा
            </span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--hh-yellow)', textTransform: 'uppercase' }}>
              HOUSE
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: 800,
              background: 'var(--hh-pink)',
              color: '#ffffff',
              padding: '0.15rem 0.4rem',
              border: '1px solid #ffffff',
              borderRadius: '3px',
              marginLeft: '0.3rem',
              letterSpacing: '0.05em'
            }}>
              2:47PM STUDIO
            </span>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '10px',
              fontWeight: 900,
              background: 'var(--hh-yellow)',
              color: 'var(--hh-black)',
              padding: '0.15rem 0.45rem',
              border: '1px solid var(--hh-black)',
              borderRadius: '3px',
              marginLeft: '0.25rem',
              letterSpacing: '0.05em'
            }}>
              #RAGInGoa
            </span>
          </div>
          <div className="text-mono" style={{ color: '#a0aec0', marginTop: '0.35rem', fontSize: '12px' }}>
            OFFICIAL DIGITAL ACTIVATION · GOA, INDIA 2026 · TASK 2 · <strong style={{ color: 'var(--hh-pink)' }}>#RAGInGoa</strong>
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
        <div className="text-mono" style={{ color: '#a0aec0', fontSize: '11px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span>Crafted by <strong style={{ color: 'var(--hh-yellow)' }}>2:47PM STUDIO</strong></span>
          <span>·</span>
          <span>Official Submission: <strong style={{ color: 'var(--hh-pink)' }}>#RAGInGoa</strong></span>
          <span>·</span>
          <span>Built for Hacker House Goa 2026 Shortlisting Task 2</span>
        </div>
      </div>
    </footer>
  );
}
