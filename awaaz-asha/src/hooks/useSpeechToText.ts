import { useState, useRef, useCallback, useEffect } from 'react';

/* ──────────────────────────────────────────────────────────────
   Web Speech API type shims
   (The API is only partially typed in lib.dom.d.ts)
   ────────────────────────────────────────────────────────────── */
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

type SpeechRecognitionCtor = new () => SpeechRecognition;

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

/* ──────────────────────────────────────────────────────────────
   Resolve the constructor (vendor-prefixed in some browsers)
   ────────────────────────────────────────────────────────────── */
function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionCtor | null;
}

/* ──────────────────────────────────────────────────────────────
   Hook
   ────────────────────────────────────────────────────────────── */
export interface UseSpeechToTextReturn {
  /** Whether the recogniser is actively listening. */
  isListening: boolean;
  /** Whether the browser supports the Web Speech API. */
  isSupported: boolean;
  /** Accumulated transcript (interim + final). */
  transcript: string;
  /** Start recognition. No-op if already listening or unsupported. */
  startListening: () => void;
  /** Stop recognition and log the final transcript. */
  stopListening: () => void;
  /** Reset the transcript. */
  resetTranscript: () => void;
}

export function useSpeechToText(lang = 'hi-IN'): UseSpeechToTextReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const isSupported = typeof window !== 'undefined' && getSpeechRecognitionCtor() !== null;

  /* Clean up on unmount */
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  /* ── Start ── */
  const startListening = useCallback(() => {
    if (!isSupported) {
      console.warn('[useSpeechToText] Web Speech API is not supported in this browser.');
      return;
    }
    if (recognitionRef.current) return; // already listening

    const Ctor = getSpeechRecognitionCtor()!;
    const recognition = new Ctor();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    finalTranscriptRef.current = '';
    setTranscript('');

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      finalTranscriptRef.current = final;
      setTranscript(final + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[useSpeechToText] Error:', event.error, event.message);
      // 'no-speech' and 'aborted' are non-fatal; others end the session
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setIsListening(false);
        recognitionRef.current = null;
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [isSupported, lang]);

  /* ── Stop ── */
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    recognitionRef.current.stop();

    // Log the final transcript for downstream processing (GPT-4o)
    const final = finalTranscriptRef.current || transcript;
    console.log('[useSpeechToText] Final transcript:', final);
  }, [transcript]);

  /* ── Reset ── */
  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
  }, []);

  return { isListening, isSupported, transcript, startListening, stopListening, resetTranscript };
}
