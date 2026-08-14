import React, { useState, useEffect, useCallback, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { VoiceInterface } from './components/VoiceInterface';
import { AnswerPanel } from './components/AnswerPanel';
import { SourcesGrid } from './components/SourcesGrid';
import { ProcessingPipeline } from './components/ProcessingPipeline';
import { LatencyDashboard } from './components/LatencyDashboard';
import { ExplanationPage } from './components/ExplanationPage';
import { Footer } from './components/Footer';
import { ScrollProgress } from './components/common/ScrollProgress';

gsap.registerPlugin(ScrollTrigger);

export function App() {
  const [view, setView] = useState(() => (window.location.hash === '#explanation' ? 'explanation' : 'main'));
  const [result, setResult] = useState(null);
  const [pipelineStage, setPipelineStage] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const lenisRef = useRef(null);

  /* ---- Sync hash route changes ---- */
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#explanation') {
        setView('explanation');
      } else {
        setView('main');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  /* ---- Lenis smooth scroll ---- */
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, [view]);

  /* ---- Load benchmark data on mount ---- */
  useEffect(() => {
    const loadBenchmark = async () => {
      try {
        const response = await fetch('/data/benchmark_results.json');
        if (response.ok) {
          const data = await response.json();
          setBenchmarkData(data);
        }
      } catch (e) {
        console.log('Benchmark data not yet available');
      }
    };
    loadBenchmark();
  }, []);

  /* ---- Handle voice/text result ---- */
  const handleResult = useCallback((data) => {
    setResult(data);
    setPipelineStage('answer');
    // Keep voice card in view
    setTimeout(() => {
      const voiceEl = document.getElementById('voice');
      if (voiceEl) voiceEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleResetQuery = useCallback(() => {
    setResult(null);
    setPipelineStage(null);
  }, []);

  /* ---- Navigation helpers ---- */
  const navigateToExplanation = useCallback(() => {
    window.location.hash = 'explanation';
    setView('explanation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToMain = useCallback(() => {
    window.location.hash = '';
    setView('main');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToVoice = useCallback(() => {
    if (view !== 'main') setView('main');
    setTimeout(() => {
      const el = document.getElementById('voice');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [view]);

  const scrollToPipeline = useCallback(() => {
    if (view !== 'main') setView('main');
    setTimeout(() => {
      const el = document.getElementById('pipeline');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [view]);

  return (
    <>
      <Navbar currentView={view} onNavigate={(v) => (v === 'explanation' ? navigateToExplanation() : navigateToMain())} />
      <ScrollProgress />

      {view === 'explanation' ? (
        <main>
          <ExplanationPage onBack={navigateToMain} currentResult={result} />
        </main>
      ) : (
        <main>
          <Hero onTryVoice={scrollToVoice} onExploreArch={scrollToPipeline} />

          <hr className="section-divider" />

          <VoiceInterface
            result={result}
            onResult={handleResult}
            onReset={handleResetQuery}
            onExplain={navigateToExplanation}
          />

          <div id="answer-section">
            <AnswerPanel result={result} onExplain={navigateToExplanation} />
          </div>

          {result?.sources?.length > 0 && (
            <SourcesGrid sources={result.sources} />
          )}

          <hr className="section-divider" />

          <ProcessingPipeline activeStage={pipelineStage} />

          <hr className="section-divider" />

          <LatencyDashboard
            latency={result?.latency}
            benchmarkData={benchmarkData}
          />
        </main>
      )}

      <Footer />
    </>
  );
}

export default App;
