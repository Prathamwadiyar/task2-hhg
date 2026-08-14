import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function Hero({ onTryVoice, onExploreArch }) {
  const containerRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 1 })
      .fromTo(titleRef.current?.children || [], { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, duration: 0.8 }, '-=0.5');
  }, []);

  const marqueeItems = [
    '#RAGInGoa',
    '500 ELITE BUILDERS',
    'HACKER HOUSE GOA 2026',
    '#RAGInGoa',
    'VOICE RAG ENGINE',
    'MULTILINGUAL RETRIEVAL',
    'SARVAM AI STT',
    'QDRANT VECTOR DB',
    'GOOGLE GEMINI LLM',
  ];

  return (
    <section id="hero" ref={containerRef} style={{ paddingTop: '5.5rem', paddingBottom: '2rem', position: 'relative' }}>
      
      {/* Top Black Marquee Ticker Banner matching hhgoa-id-2026 */}
      <div className="ticker-banner" style={{ marginBottom: '2.5rem' }}>
        <div className="ticker-track">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, idx) => (
            <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '1.5rem' }}>
              <span style={item === '#RAGInGoa' ? { color: 'var(--hh-yellow)', fontWeight: 900, textShadow: '0 0 10px rgba(254, 225, 1, 0.5)' } : {}}>{item}</span>
              <span style={{ color: 'var(--hh-pink)' }}>★</span>
            </span>
          ))}
        </div>
      </div>

      <div className="container">
        
        {/* Top Official Pill Badges including #RAGInGoa & 2:47PM STUDIO */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 1.25rem',
            background: 'var(--hh-pink)',
            color: '#ffffff',
            border: '2px solid var(--hh-black)',
            borderRadius: '999px',
            boxShadow: '3px 3px 0px #000000',
            fontFamily: 'var(--font-heading)',
            fontSize: '14px',
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            <span style={{ color: 'var(--hh-yellow)' }}>★</span> #RAGInGoa
          </span>

          <span style={{
            display: 'inline-block',
            padding: '0.35rem 1rem',
            background: 'rgba(255, 0, 128, 0.08)',
            color: 'var(--hh-pink)',
            border: '1.5px solid rgba(255, 0, 128, 0.3)',
            borderRadius: '999px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            OFFICIAL HH GOA 2026 · TASK 2 DIGITAL ACTIVATION
          </span>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 1rem',
            background: 'var(--hh-yellow)',
            color: 'var(--hh-black)',
            border: '1.5px solid var(--hh-black)',
            borderRadius: '999px',
            boxShadow: '2px 2px 0px #000000',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            <span style={{ color: 'var(--hh-pink)' }}>★</span> 2:47PM STUDIO
          </span>
        </div>

        {/* Hero Title & Identity Container */}
        <div ref={titleRef} style={{ textAlign: 'center', position: 'relative', margin: '0.5rem 0 2rem' }}>
          
          {/* Smooth & Sexy Hacker House Goa Container matching reference image */}
          <div className="hero-title-container">
            <h1 className="hero-original-title">
              <span>HACKER</span>
              <span className="devanagari-goa-overlay" title="Goa in Hindi">
                गोवा
              </span>
              <span>HOUSE</span>
            </h1>
          </div>

          {/* Prominent #RAGInGoa Highlight Spotlight Ribbon */}
          <div style={{
            margin: '1.25rem auto 1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: '#073d22',
            color: '#ffffff',
            padding: '0.5rem 1.4rem',
            border: '2px solid var(--hh-yellow)',
            borderRadius: '8px',
            boxShadow: '4px 4px 0px var(--hh-pink)',
          }}>
            <span style={{ color: 'var(--hh-yellow)', fontSize: '1.1rem', fontWeight: 900 }}>✦</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', color: '#e2e8f0' }}>
              OFFICIAL TASK HASHTAG:
            </span>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '17px',
              fontWeight: 900,
              background: 'var(--hh-pink)',
              color: '#ffffff',
              padding: '0.2rem 0.75rem',
              borderRadius: '4px',
              letterSpacing: '0.06em',
              textShadow: '1px 1px 0px #000',
              border: '1.5px solid #fee101'
            }}>
              #RAGInGoa
            </span>
          </div>

          {/* Subheading */}
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.8rem, 5vw, 3.2rem)',
            fontWeight: 800,
            color: 'var(--hh-black)',
            textTransform: 'uppercase',
            marginTop: '0.5rem',
            letterSpacing: '0.02em',
          }}>
            VOICE-ENABLED RAG PIPELINE
          </div>

          <p style={{
            maxWidth: '650px',
            margin: '1rem auto 2.25rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
            lineHeight: 1.6,
          }}>
            Production-quality Speech-to-Text & Multilingual Vector Search powered by Sarvam AI, Qdrant DB, and Google Gemini LLM.
          </p>

          {/* Neo-Brutalist Action Buttons */}
          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={onTryVoice}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
              TRY VOICE RAG NOW
            </button>
            <button className="btn-secondary" onClick={onExploreArch}>
              EXPLORE ARCHITECTURE →
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
