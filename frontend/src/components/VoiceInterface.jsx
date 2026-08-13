import React, { useState, useRef, useCallback, useEffect } from 'react';
import { queryVoice, queryText } from '../services/api';

const LANGUAGES = [
  { code: 'hi-IN', label: 'HINDI (हिंदी)' },
  { code: 'en-IN', label: 'ENGLISH (INDIA)' },
];

const SUGGESTIONS = [
  'What is a corporation?',
  'कॉरपोरेशन क्या है?',
  'What is Quantum Computing?',
  'Which is capital of india?',
];

export function VoiceInterface({ onResult }) {
  const [stage, setStage] = useState('idle');
  const [language, setLanguage] = useState('hi-IN');
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);
  const [textQuery, setTextQuery] = useState('');
  const [waveformBars, setWaveformBars] = useState(Array(24).fill(6));

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const speechTranscriptRef = useRef('');

  /* ---- Waveform animation from live mic ---- */
  const startWaveform = useCallback((stream) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    analyserRef.current = { audioCtx, analyser };

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      const bars = Array.from({ length: 24 }, (_, i) => {
        const val = dataArray[Math.floor(i * dataArray.length / 24)] || 0;
        return Math.max(5, (val / 255) * 45);
      });
      setWaveformBars(bars);
      animFrameRef.current = requestAnimationFrame(update);
    };
    update();
  }, []);

  const stopWaveform = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (analyserRef.current?.audioCtx) analyserRef.current.audioCtx.close();
    setWaveformBars(Array(24).fill(6));
  }, []);

  /* ---- Recording logic ---- */
  const startRecording = useCallback(async () => {
    setError(null);
    setStage('listening');
    speechTranscriptRef.current = '';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;
        recognition.onresult = (event) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            speechTranscriptRef.current = currentTranscript.trim();
          }
        };
        recognition.start();
        speechRecognitionRef.current = recognition;
      } catch (e) {
        console.warn('Browser SpeechRecognition init failed:', e);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setStage('recording');
      startWaveform(stream);

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => handleRecordingComplete();
      recorder.start();
      mediaRecorderRef.current = recorder;

      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      setError('Microphone access denied. Please allow permission.');
      setStage('idle');
    }
  }, [language, startWaveform]);

  const stopRecording = useCallback(() => {
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    clearInterval(timerRef.current);
    stopWaveform();
  }, [stopWaveform]);

  const handleRecordingComplete = useCallback(async () => {
    setStage('transcribing');
    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
    try {
      setStage('retrieving');
      let result = await queryVoice(audioFile, language);

      const isFallback = result.transcription === 'कॉरपोरेशन क्या है?' || result.transcription === 'What is a corporation?';
      if (isFallback && speechTranscriptRef.current) {
        const isoLang = language.split('-')[0].lower ? language.split('-')[0].lower() : 'hi';
        result = await queryText(speechTranscriptRef.current, isoLang);
        result.transcription = speechTranscriptRef.current;
      }

      setStage('generating');
      await new Promise((r) => setTimeout(r, 300));
      setStage('complete');
      onResult(result);
    } catch (err) {
      if (speechTranscriptRef.current) {
        try {
          const isoLang = language.split('-')[0];
          const textResult = await queryText(speechTranscriptRef.current, isoLang);
          textResult.transcription = speechTranscriptRef.current;
          setStage('complete');
          onResult(textResult);
          return;
        } catch (textErr) {}
      }
      setError(err.message || 'Voice query failed.');
      setStage('idle');
    }
  }, [language, onResult]);

  /* ---- Submit Text Query ---- */
  const submitQuery = useCallback(async (queryStr) => {
    if (!queryStr.trim()) return;
    setError(null);
    setStage('retrieving');
    try {
      const result = await queryText(queryStr.trim(), language === 'hi-IN' ? 'hi' : 'en');
      setStage('complete');
      onResult(result);
    } catch (err) {
      setError(err.message || 'Query failed.');
      setStage('idle');
    }
  }, [language, onResult]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      stopWaveform();
    };
  }, [stopWaveform]);

  const isRecording = stage === 'recording';
  const isProcessing = ['transcribing', 'retrieving', 'generating'].includes(stage);
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <section id="voice" className="section section-dark">
      <div className="container">
        
        {/* Simple Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="text-label" style={{ marginBottom: '0.5rem', display: 'block' }}>VOICE & TEXT ENGINE</span>
          <h2 className="heading-section">
            ASK <span style={{ color: 'var(--hh-pink)' }}>ANYTHING</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px', marginTop: '0.4rem' }}>
            Tap the mic to speak or type your question below.
          </p>
        </div>

        {/* Single Unified Neo-Brutalist Interface Card */}
        <div className="card-brutalist" style={{ maxWidth: '680px', margin: '0 auto', padding: '2.5rem 2rem 2rem', background: 'var(--hh-white)', textAlign: 'center' }}>
          
          {/* 1. Language Toggle Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            {LANGUAGES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                style={{
                  padding: '0.5rem 1.25rem',
                  border: '2px solid #000',
                  background: language === code ? 'var(--hh-yellow)' : 'var(--hh-white)',
                  color: '#000',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: language === code ? '3px 3px 0px #000' : '2px 2px 0px #000',
                  transition: 'all 0.15s ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 2. Hero Microphone Button & Animated Waveform */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.5rem 0 2rem' }}>
            
            <button
              className={`mic-btn ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              style={{
                width: '120px',
                height: '120px',
                marginBottom: '1.25rem',
              }}
            >
              {isProcessing ? (
                <div style={{ width: '32px', height: '32px', border: '4px solid #000', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : (
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  {isRecording ? (
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  ) : (
                    <>
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                    </>
                  )}
                </svg>
              )}
            </button>

            {/* Clear Status Message */}
            <div className="text-mono" style={{ fontSize: '14px', fontWeight: 800, color: isRecording ? 'var(--hh-pink)' : '#000', letterSpacing: '0.04em' }}>
              {stage === 'idle' && 'TAP MICROPHONE TO SPEAK'}
              {stage === 'listening' && 'ACCESSING MIC...'}
              {stage === 'recording' && `● RECORDING AUDIO (${formatTime(duration)}) — TAP TO STOP`}
              {stage === 'transcribing' && 'TRANSCRIBING AUDIO...'}
              {stage === 'retrieving' && 'SEARCHING KNOWLEDGE BASE...'}
              {stage === 'generating' && 'GENERATING ANSWER...'}
              {stage === 'complete' && 'QUERY COMPLETE ✓'}
            </div>

            {/* Dynamic Waveform Visualizer */}
            {isRecording && (
              <div className="waveform-container" style={{ justifyContent: 'center', height: '40px', gap: '4px', marginTop: '1rem' }}>
                {waveformBars.map((h, i) => (
                  <div key={i} className="waveform-bar" style={{ height: `${h}px`, background: i % 2 === 0 ? 'var(--hh-pink)' : 'var(--hh-yellow)' }} />
                ))}
              </div>
            )}
          </div>

          {/* 3. Text Search Input Bar */}
          <form onSubmit={(e) => { e.preventDefault(); submitQuery(textQuery); }} style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <input
              type="text"
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              placeholder="Or type your question here..."
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: '0.9rem 1.25rem',
                background: 'var(--hh-white)',
                border: '2px solid #000',
                color: '#000',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none',
                boxShadow: '3px 3px 0px #000',
              }}
            />
            <button className="btn-primary" type="submit" disabled={isProcessing || !textQuery.trim()}>
              SEARCH
            </button>
          </form>

          {/* 4. Quick Suggestion Chips */}
          <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
            <div className="text-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>
              SUGGESTED QUESTIONS:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {SUGGESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => { setTextQuery(q); submitQuery(q); }}
                  disabled={isProcessing}
                  style={{
                    padding: '0.35rem 0.75rem',
                    background: 'var(--hh-gray-light)',
                    border: '1.5px solid #000',
                    color: '#000',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: '1.25rem',
              padding: '0.75rem 1rem',
              background: 'var(--status-error-bg)',
              border: '2px solid var(--status-error)',
              color: 'var(--status-error)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 800,
            }}>
              {error}
            </div>
          )}

        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
