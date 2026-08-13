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
import { Footer } from './components/Footer';
import { ScrollProgress } from './components/common/ScrollProgress';

gsap.registerPlugin(ScrollTrigger);

export function App() {
  const [result, setResult] = useState(null);
  const [pipelineStage, setPipelineStage] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const lenisRef = useRef(null);

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
  }, []);

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
        // Benchmark data not available yet — silently ignore
        console.log('Benchmark data not yet available');
      }
    };
    loadBenchmark();
  }, []);

  /* ---- Handle voice/text result ---- */
  const handleResult = useCallback((data) => {
    setResult(data);
    setPipelineStage('answer');
    // Scroll to answer after short delay
    setTimeout(() => {
      const answerEl = document.getElementById('answer-section');
      if (answerEl) answerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }, []);

  /* ---- Navigation helpers ---- */
  const scrollToVoice = useCallback(() => {
    const el = document.getElementById('voice');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToPipeline = useCallback(() => {
    const el = document.getElementById('pipeline');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      <Navbar />
      <ScrollProgress />

      <main>
        <Hero onTryVoice={scrollToVoice} onExploreArch={scrollToPipeline} />

        <hr className="section-divider" />

        <VoiceInterface onResult={handleResult} />

        <div id="answer-section">
          <AnswerPanel result={result} />
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

      <Footer />
    </>
  );
}

export default App;
