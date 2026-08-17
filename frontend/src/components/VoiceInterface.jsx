import React, { useState, useRef, useCallback, useEffect } from 'react';
import { queryVoice, queryText, cleanMarkdownToProse } from '../services/api';

const LANGUAGES = [
  { code: 'en-IN', label: 'ENGLISH (INDIA)' },
  { code: 'hi-IN', label: 'HINDI (हिंदी)' },
  { code: 'kn-IN', label: 'KANNADA (ಕನ್ನಡ)' },
  { code: 'mr-IN', label: 'MARATHI (मराठी)' },
];

const SUGGESTIONS_BY_LANG = {
  'en-IN': [
    { genre: 'AI & TECH', text: 'What is Retrieval-Augmented Generation (RAG)?', color: 'var(--hh-pink)' },
    { genre: 'QUANTUM', text: 'How do quantum computers process superposition?', color: 'var(--hh-green)' },
    { genre: 'GOA HERITAGE', text: 'What is the historical significance of Aguada Fort in Goa?', color: 'var(--hh-yellow)' },
    { genre: 'ECONOMICS', text: 'How does inflation impact emerging global markets?', color: '#38bdf8' },
    { genre: 'OCEAN SCIENCE', text: 'What causes bioluminescence in coastal ocean waves?', color: '#a855f7' },
  ],
  'hi-IN': [
    { genre: 'तकनीक', text: 'आर्टिफिशियल इंटेलिजेंस और मशीन लर्निंग में क्या अंतर है?', color: 'var(--hh-pink)' },
    { genre: 'अंतरिक्ष विज्ञान', text: 'ब्लैक होल कैसे बनते हैं और उनका गुरुत्वाकर्षण कैसा होता है?', color: 'var(--hh-green)' },
    { genre: 'गोवा धरोहर', text: 'गोवा के प्रमुख ऐतिहासिक किले और सांस्कृतिक धरोहर कौन से हैं?', color: 'var(--hh-yellow)' },
    { genre: 'अर्थव्यवस्था', text: 'शेयर बाजार में म्यूचुअल फंड कैसे काम करते हैं?', color: '#38bdf8' },
    { genre: 'पर्यावरण', text: 'समुद्र की लहरों में जैव-संदीप्ति (Bioluminescence) कैसे उत्पन्न होती है?', color: '#a855f7' },
  ],
  'kn-IN': [
    { genre: 'ತಂತ್ರಜ್ಞಾನ', text: 'ಕ್ವಾಂಟಮ್ ಕಂಪ್ಯೂಟಿಂಗ್ ತಂತ್ರಜ್ಞಾನ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?', color: 'var(--hh-pink)' },
    { genre: 'ಖಗೋಳಶಾಸ್ತ್ರ', text: 'ಸೌರವ್ಯೂಹದಲ್ಲಿ ಅತ್ಯಂತ ದೊಡ್ಡ ಗ್ರಹ ಯಾವುದು ಮತ್ತು ಅದರ ವಿಶೇಷತೆ ಏನು?', color: 'var(--hh-green)' },
    { genre: 'ಇತಿಹಾಸ', text: 'ವಿಜಯನಗರ ಸಾಮ್ರಾಜ್ಯದ ಇತಿಹಾಸ ಮತ್ತು ವಾಸ್ತುಶಿಲ್ಪದ ಮಹತ್ವವೇನು?', color: 'var(--hh-yellow)' },
    { genre: 'ಆರ್ಥಿಕತೆ', text: 'ಭಾರತೀಯ ಆರ್ಥಿಕತೆಯಲ್ಲಿ ಡಿಜಿಟಲ್ ಪಾವತಿ ವ್ಯವಸ್ಥೆಯ ಪಾತ್ರವೇನು?', color: '#38bdf8' },
    { genre: 'ಗೋವಾ ಪ್ರವಾಸೋದ್ಯಮ', text: 'ಗೋವಾದ ಪ್ರಸಿದ್ಧ ಕಡಲತೀರಗಳು ಮತ್ತು ಸಾಂಸ್ಕೃತಿಕ ಆಕರ್ಷಣೆಗಳು ಯಾವುವು?', color: '#a855f7' },
  ],
  'mr-IN': [
    { genre: 'तंत्रज्ञान', text: 'क्लाउड कम्प्यूटिंग म्हणजे काय आणि त्याचे प्रमुख फायदे कोणते?', color: 'var(--hh-pink)' },
    { genre: 'विज्ञान', text: 'सूर्यमालेतील ग्रहांची निर्मिती कशी झाली आणि त्यांचे प्रकार कोणते?', color: 'var(--hh-green)' },
    { genre: 'इतिहास', text: 'छत्रपती शिवाजी महाराजांच्या जलदुर्गांचे सामरिक महत्त्व काय होते?', color: 'var(--hh-yellow)' },
    { genre: 'अर्थशास्त्र', text: 'स्टार्टअप्ससाठी व्हेंचर कॅपिटल आणि एंजल फंडिंग कसे कार्य करते?', color: '#38bdf8' },
    { genre: 'गोवा वारसा', text: 'गोव्यातील प्राचीन मंदिरे आणि पोर्तुगीज चर्चचा ऐतिहासिक वारसा काय आहे?', color: '#a855f7' },
  ],
};

export function VoiceInterface({ result, onResult, onReset, onExplain }) {
  const [stage, setStage] = useState('idle');
  const [language, setLanguage] = useState('en-IN');
  const [suggestionTab, setSuggestionTab] = useState('ALL');
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
      const spokenTranscript = speechTranscriptRef.current?.trim();
      let resultRes = null;

      if (spokenTranscript) {
        const isoLang = language.split('-')[0].toLowerCase();
        resultRes = await queryText(spokenTranscript, isoLang);
        if (typeof resultRes === 'object' && resultRes !== null) {
          resultRes.transcription = spokenTranscript;
          resultRes.query = spokenTranscript;
        }
      } else {
        resultRes = await queryVoice(audioFile, language);
      }

      setStage('generating');
      await new Promise((r) => setTimeout(r, 300));
      setStage('complete');
      onResult(resultRes);
    } catch (err) {
      if (speechTranscriptRef.current) {
        try {
          const isoLang = language.split('-')[0].toLowerCase();
          const textResult = await queryText(speechTranscriptRef.current, isoLang);
          if (typeof textResult === 'object' && textResult !== null) {
            textResult.transcription = speechTranscriptRef.current;
            setStage('complete');
            onResult(textResult);
            return;
          }
        } catch (textErr) {}
      }
      const isConnRefused = err.message?.includes('504') || err.message?.includes('Fetch') || err.message?.includes('Failed') || err.message?.includes('unreachable') || err.message?.includes('HTML');
      setError(
        isConnRefused
          ? 'Backend server not responding. Please ensure Python backend is running on http://localhost:8000 (or configure VITE_API_BASE_URL).'
          : (err.message || 'Voice query failed.')
      );
      setStage('idle');
    }
  }, [language, onResult]);

  /* ---- Submit Text Query ---- */
  const submitQuery = useCallback(async (queryStr, overrideLang) => {
    if (!queryStr.trim()) return;
    const targetLang = overrideLang || language;
    if (overrideLang && overrideLang !== language) {
      setLanguage(overrideLang);
    }
    setError(null);
    setStage('retrieving');
    try {
      const isoLang = targetLang.split('-')[0].toLowerCase();
      const resultRes = await queryText(queryStr.trim(), isoLang);
      setStage('complete');
      onResult(resultRes);
    } catch (err) {
      setError(err.message || 'Query failed.');
      setStage('idle');
    }
  }, [language, onResult]);

  const handleAskAgain = useCallback(() => {
    if (onReset) onReset();
    setStage('idle');
    setTextQuery('');
    setError(null);
  }, [onReset]);

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
            {result ? 'View your question & answer below, or click Ask Again for a new question.' : 'Tap the mic to speak or type your question below.'}
          </p>
        </div>

        {/* Single Unified Neo-Brutalist Interface Card */}
        <div className="card-brutalist" style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 2rem 2rem', background: 'var(--hh-white)', textAlign: 'center' }}>
          
          {result ? (
            /* ---- Inline Question & Answer Result View ---- */
            <div style={{ textAlign: 'left' }}>
              {/* Header & Top Ask Again Action */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '2px solid #000', paddingBottom: '0.85rem' }}>
                <span className="text-label" style={{ fontSize: '12px' }}>ANSWER GENERATED INLINE</span>
                <button
                  onClick={handleAskAgain}
                  className="btn-primary"
                  style={{
                    padding: '0.45rem 1.1rem',
                    fontSize: '12px',
                    background: 'var(--hh-yellow)',
                    color: '#000',
                    boxShadow: '2.5px 2.5px 0px #000',
                    fontWeight: 800,
                  }}
                >
                  ↺ ASK AGAIN
                </button>
              </div>

              {/* 1. Asked Question (Transcription) */}
              {result.transcription && (
                <div style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', background: 'var(--hh-gray-light)', border: '2px solid #000', boxShadow: '3px 3px 0px #000' }}>
                  <span className="text-label" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>YOUR ASKED QUESTION:</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#000', marginTop: '0.25rem', fontStyle: 'italic' }}>
                    "{result.transcription}"
                  </div>
                </div>
              )}

              {/* 2. Generated Answer Box */}
              <div className="card-brutalist" style={{ background: '#fff', border: '2px solid #000', borderLeft: `6px solid ${result.guardrail_passed !== false ? 'var(--status-success)' : 'var(--status-warning)'}`, padding: '1.5rem', boxShadow: '4px 4px 0px #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className="text-label" style={{ fontSize: '11px' }}>AI GROUNDED RESPONSE</span>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span className={`badge ${result.guardrail_passed !== false ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '10px' }}>
                      {result.guardrail_passed !== false ? '✓ GROUNDED' : '⚠ LOW CONFIDENCE'}
                    </span>
                    <span className="badge badge-yellow" style={{ fontSize: '10px' }}>
                      {result.sources?.length || 0} SOURCE{(result.sources?.length || 0) !== 1 ? 'S' : ''}
                    </span>
                    <span className="badge badge-pink" style={{ fontSize: '10px' }}>
                      {(result.latency?.total_ms || 0).toFixed(1)}ms
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#000', fontWeight: 500, margin: 0 }}>
                  {(cleanMarkdownToProse(result.answer) || '').split('\n\n').map((para, idx, arr) => (
                    <p key={idx} style={{ marginBottom: idx < arr.length - 1 ? '1.1rem' : 0 }}>
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              {/* 3. Bottom Action Buttons Bar */}
              <div style={{ marginTop: '1.75rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleAskAgain}
                  className="btn-primary"
                  style={{
                    padding: '0.8rem 1.8rem',
                    fontSize: '13px',
                    background: 'var(--hh-yellow)',
                    color: '#000',
                    boxShadow: '3px 3px 0px #000',
                    fontWeight: 800,
                  }}
                >
                  ↺ ASK AGAIN
                </button>

                {onExplain && (
                  <button
                    onClick={onExplain}
                    className="btn-primary"
                    style={{
                      padding: '0.8rem 1.5rem',
                      fontSize: '13px',
                      background: 'var(--hh-pink)',
                      color: '#fff',
                      boxShadow: '3px 3px 0px #000',
                      fontWeight: 800,
                    }}
                  >
                    EXPLAIN PROCESS →
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ---- Normal Input Controls View ---- */
            <>
              {/* 1. Language Toggle Bar */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
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
              <form onSubmit={(e) => { e.preventDefault(); submitQuery(textQuery); }} style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
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

              {/* 4. Quick Multilingual Suggestion Chips by Genre */}
              <div style={{ marginTop: '1.75rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div className="text-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.05em' }}>
                    SUGGESTED QUESTIONS BY GENRE:
                  </div>

                  {/* Mini Language Filter Pills */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {[
                      { code: 'ALL', label: 'ALL LANGUAGES' },
                      { code: 'en-IN', label: 'ENG' },
                      { code: 'hi-IN', label: 'हिंदी' },
                      { code: 'kn-IN', label: 'ಕನ್ನಡ' },
                      { code: 'mr-IN', label: 'मराठी' },
                    ].map((tab) => (
                      <button
                        key={tab.code}
                        type="button"
                        onClick={() => setSuggestionTab(tab.code)}
                        style={{
                          padding: '0.15rem 0.5rem',
                          background: suggestionTab === tab.code ? '#000' : 'var(--hh-gray-light)',
                          color: suggestionTab === tab.code ? 'var(--hh-yellow)' : '#000',
                          border: '1.5px solid #000',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          borderRadius: '3px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Multilingual Suggestion Chips */}
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {(suggestionTab === 'ALL'
                    ? [
                        { ...SUGGESTIONS_BY_LANG['en-IN'][0], lang: 'EN', langCode: 'en-IN' },
                        { ...SUGGESTIONS_BY_LANG['hi-IN'][0], lang: 'HI', langCode: 'hi-IN' },
                        { ...SUGGESTIONS_BY_LANG['kn-IN'][0], lang: 'KN', langCode: 'kn-IN' },
                        { ...SUGGESTIONS_BY_LANG['mr-IN'][0], lang: 'MR', langCode: 'mr-IN' },
                        { ...SUGGESTIONS_BY_LANG['en-IN'][2], lang: 'EN', langCode: 'en-IN' },
                        { ...SUGGESTIONS_BY_LANG['hi-IN'][1], lang: 'HI', langCode: 'hi-IN' },
                        { ...SUGGESTIONS_BY_LANG['kn-IN'][2], lang: 'KN', langCode: 'kn-IN' },
                        { ...SUGGESTIONS_BY_LANG['mr-IN'][2], lang: 'MR', langCode: 'mr-IN' },
                      ]
                    : (SUGGESTIONS_BY_LANG[suggestionTab] || []).map((item) => ({
                        ...item,
                        lang: suggestionTab.split('-')[0].toUpperCase(),
                        langCode: suggestionTab,
                      }))
                  ).map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTextQuery(item.text);
                        submitQuery(item.text, item.langCode);
                      }}
                      disabled={isProcessing}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.4rem 0.8rem',
                        background: 'var(--hh-white)',
                        border: '1.5px solid #000',
                        boxShadow: '2px 2px 0px #000',
                        color: '#000',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        borderRadius: '4px',
                        transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s ease, background 0.15s ease',
                        textAlign: 'left',
                        lineHeight: 1.3,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '4px 4px 0px #000';
                        e.currentTarget.style.background = 'var(--hh-yellow)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0px)';
                        e.currentTarget.style.boxShadow = '2px 2px 0px #000';
                        e.currentTarget.style.background = 'var(--hh-white)';
                      }}
                    >
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 900,
                        background: '#000',
                        color: item.color || 'var(--hh-yellow)',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '2px',
                        letterSpacing: '0.04em',
                      }}>
                        {item.genre}
                      </span>
                      <span>"{item.text}"</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

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
