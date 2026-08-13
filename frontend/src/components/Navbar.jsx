import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const NAV_ITEMS = [
  { id: 'hero', label: 'Home' },
  { id: 'voice', label: 'Voice RAG' },
  { id: 'pipeline', label: 'Architecture' },
  { id: 'evaluation', label: 'Evaluation' },
];

export function Navbar() {
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(navRef.current, { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -40% 0px' }
    );
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav ref={navRef} className="navbar" role="navigation" aria-label="Main">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <a className="navbar-logo" href="#hero" onClick={(e) => { e.preventDefault(); scrollTo('hero'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, color: 'var(--hh-green)', fontSize: '1.4rem', letterSpacing: '-0.01em' }}>
            HACKER HOUSE
          </span>
          <span style={{
            fontFamily: 'var(--font-devanagari)',
            background: 'var(--hh-pink)',
            color: '#ffffff',
            fontSize: '0.7rem',
            padding: '0.05rem 0.35rem',
            borderRadius: '999px',
            border: '2px solid #000000',
            fontWeight: 700,
            lineHeight: 1.1,
          }}>
            गोवा
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <ul className="navbar-links">
          {NAV_ITEMS.map(({ id, label }) => (
            <li key={id}>
              <button
                className={`navbar-link ${activeSection === id ? 'active' : ''}`}
                onClick={() => scrollTo(id)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        {/* Right CTA Button matching hhgoa-id-2026 */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn-primary"
            onClick={() => scrollTo('voice')}
            style={{
              padding: '0.45rem 1.1rem',
              fontSize: '12px',
              background: 'var(--hh-green)',
              color: '#ffffff',
            }}
          >
            TRY RAG
          </button>
          
          <button
            className="navbar-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
            style={{ background: 'none', border: 'none', color: 'var(--hh-black)', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div style={{ background: 'var(--hh-offwhite)', borderTop: '2px solid var(--hh-black)', padding: '1rem 1.5rem' }}>
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              className={`navbar-link ${activeSection === id ? 'active' : ''}`}
              onClick={() => scrollTo(id)}
              style={{ display: 'block', padding: '0.75rem 0', width: '100%', textAlign: 'left', fontSize: '14px' }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
