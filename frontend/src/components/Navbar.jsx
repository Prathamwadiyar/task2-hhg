import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const NAV_ITEMS = [
  { id: 'hero', label: 'Home' },
  { id: 'voice', label: 'Voice RAG' },
  { id: 'pipeline', label: 'Architecture' },
  { id: 'evaluation', label: 'Evaluation' },
];

export function Navbar({ currentView = 'main', onNavigate }) {
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(navRef.current, { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' });
  }, []);

  useEffect(() => {
    if (currentView !== 'main') return;
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
  }, [currentView]);

  const handleNavClick = (id) => {
    setMobileOpen(false);
    if (id === 'explanation') {
      if (onNavigate) onNavigate('explanation');
      return;
    }

    if (currentView !== 'main') {
      if (onNavigate) onNavigate('main');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }

    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav ref={navRef} className="navbar" role="navigation" aria-label="Main">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <a className="navbar-logo" href="#hero" onClick={(e) => { e.preventDefault(); handleNavClick('hero'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, color: 'var(--hh-green)', fontSize: '1.35rem', letterSpacing: '-0.01em' }}>
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
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, color: 'var(--hh-green)', fontSize: '1.35rem', letterSpacing: '-0.01em' }}>
            HOUSE
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            fontWeight: 800,
            background: 'var(--hh-yellow)',
            color: 'var(--hh-black)',
            padding: '0.15rem 0.4rem',
            border: '1px solid var(--hh-black)',
            boxShadow: '1.5px 1.5px 0px #000',
            borderRadius: '3px',
            marginLeft: '0.3rem',
            letterSpacing: '0.05em'
          }}>
            2:47PM STUDIO
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <ul className="navbar-links">
          {NAV_ITEMS.map(({ id, label }) => (
            <li key={id}>
              <button
                className={`navbar-link ${currentView === 'main' && activeSection === id ? 'active' : ''}`}
                onClick={() => handleNavClick(id)}
              >
                {label}
              </button>
            </li>
          ))}
          <li>
            <button
              className={`navbar-link ${currentView === 'explanation' ? 'active' : ''}`}
              onClick={() => handleNavClick('explanation')}
              style={{
                color: currentView === 'explanation' ? 'var(--hh-pink)' : 'var(--hh-black)',
                fontWeight: 800,
              }}
            >
              ✦ Explainer
            </button>
          </li>
        </ul>

        {/* Right CTA Button */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {currentView === 'explanation' ? (
            <button
              className="btn-primary"
              onClick={() => handleNavClick('voice')}
              style={{
                padding: '0.45rem 1.1rem',
                fontSize: '12px',
                background: 'var(--hh-yellow)',
                color: 'var(--hh-black)',
              }}
            >
              ← LIVE APP
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={() => handleNavClick('voice')}
              style={{
                padding: '0.45rem 1.1rem',
                fontSize: '12px',
                background: 'var(--hh-green)',
                color: '#ffffff',
              }}
            >
              TRY RAG
            </button>
          )}
          
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
              className={`navbar-link ${currentView === 'main' && activeSection === id ? 'active' : ''}`}
              onClick={() => handleNavClick(id)}
              style={{ display: 'block', padding: '0.75rem 0', width: '100%', textAlign: 'left', fontSize: '14px' }}
            >
              {label}
            </button>
          ))}
          <button
            className={`navbar-link ${currentView === 'explanation' ? 'active' : ''}`}
            onClick={() => handleNavClick('explanation')}
            style={{ display: 'block', padding: '0.75rem 0', width: '100%', textAlign: 'left', fontSize: '14px', color: 'var(--hh-pink)', fontWeight: 800 }}
          >
            ✦ Process Explainer
          </button>
        </div>
      )}
    </nav>
  );
}
