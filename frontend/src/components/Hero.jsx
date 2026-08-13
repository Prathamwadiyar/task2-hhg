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
    '500 ELITE BUILDERS',
    'HACKER HOUSE GOA 2026',
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
              <span>{item}</span>
              <span style={{ color: 'var(--hh-pink)' }}>★</span>
            </span>
          ))}
        </div>
      </div>

      <div className="container">
        
        {/* Top Official Pill Badge */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
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
        </div>

        {/* Hero Title & Identity Container */}
        <div ref={titleRef} style={{ textAlign: 'center', position: 'relative', margin: '1rem 0 2rem' }}>
          
          {/* Main Display Title with Devanagari Pink Sticker Badge */}
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(3.5rem, 12vw, 9rem)',
            fontWeight: 900,
            lineHeight: 0.88,
            color: 'var(--hh-green)',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            position: 'relative',
            display: 'inline-block',
            margin: '0 auto',
          }}>
            HACKER{' '}
            <span style={{
              display: 'inline-block',
              position: 'relative',
              margin: '0 0.1em',
              verticalAlign: 'middle',
            }}>
              {/* Pink Devanagari Badge */}
              <span style={{
                fontFamily: 'var(--font-devanagari)',
                background: 'var(--hh-pink)',
                color: '#ffffff',
                fontSize: '0.42em',
                padding: '0.12em 0.4em',
                borderRadius: '999px',
                border: '3px solid #000000',
                boxShadow: '4px 4px 0px #000000',
                display: 'inline-block',
                transform: 'rotate(-6deg) translateY(-0.15em)',
                lineHeight: 1.1,
                fontWeight: 700,
                textTransform: 'none',
              }}>
                गोवा
              </span>
            </span>
            HOUSE
          </h1>

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
            margin: '1.25rem auto 2.25rem',
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
