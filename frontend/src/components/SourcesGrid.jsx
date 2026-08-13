import React from 'react';

export function SourcesGrid({ sources }) {
  if (!sources?.length) return null;

  const getScoreColor = (score) => {
    if (score >= 0.7) return 'var(--status-success)';
    if (score >= 0.4) return '#d97706';
    return '#dc2626';
  };

  const getRelevance = (score) => {
    if (score >= 0.7) return 'HIGH MATCH';
    if (score >= 0.4) return 'MED MATCH';
    return 'LOW MATCH';
  };

  return (
    <section className="section section-dark">
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <span className="text-label">RETRIEVED CONTEXT</span>
          <h2 className="heading-section" style={{ marginTop: '0.35rem' }}>
            VECTOR <span style={{ color: 'var(--hh-pink)' }}>SOURCES</span> ({sources.length})
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {sources.map((src, idx) => (
            <div key={idx} className="card-brutalist" style={{ background: 'var(--hh-white)', opacity: 1, visibility: 'visible' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <span className="text-label" style={{ color: 'var(--hh-black)', fontWeight: 800 }}>CHUNK #{idx + 1}</span>
                  {src.chunk_id && (
                    <div className="text-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {src.chunk_id.substring(0, 18)}...
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-mono" style={{ color: getScoreColor(src.score || 0), fontWeight: 800, fontSize: '14px' }}>
                    {((src.score || 0) * 100).toFixed(1)}%
                  </div>
                  <div className="text-mono" style={{ fontSize: '10px', fontWeight: 700, color: getScoreColor(src.score || 0) }}>
                    {getRelevance(src.score || 0)}
                  </div>
                </div>
              </div>

              {/* Score bar */}
              <div style={{ height: '4px', background: 'var(--hh-gray-light)', border: '1px solid var(--hh-black)', marginBottom: '0.75rem' }}>
                <div style={{ height: '100%', width: `${(src.score || 0) * 100}%`, background: getScoreColor(src.score || 0), transition: 'width 0.5s ease' }} />
              </div>

              {/* Meta badges */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {src.language && <span className="badge badge-yellow">{src.language}</span>}
                {src.doc_id && <span className="badge" style={{ background: '#f3eed8', color: 'var(--hh-black)' }}>{src.doc_id.substring(0, 20)}</span>}
              </div>

              {/* Text preview */}
              <p style={{ fontSize: '13px', color: 'var(--hh-black)', fontFamily: 'var(--font-mono)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {src.text || 'No text preview available.'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
