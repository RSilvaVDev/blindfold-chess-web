import { useCallback, useEffect, useRef, useState } from 'react';

// The slice of the Web Speech API this app uses. Chrome and Edge expose it as
// webkitSpeechRecognition; TypeScript's DOM types do not include it.
interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<RecognitionAlternative>>;
}
interface RecognitionErrorEvent {
  error: string;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed':
    'Microphone access is blocked. Allow it in your browser, or type your move.',
  'service-not-allowed':
    'Speech recognition is blocked in this browser. Type your move instead.',
  'no-speech': "I didn't hear anything. Press Speak a move and try again.",
  'audio-capture': 'No microphone was found. Type your move instead.',
  network:
    'Speech recognition needs a network connection. Type your move instead.',
};

export interface SpeechRecognitionState {
  supported: boolean;
  listening: boolean;
  start: () => void;
  stop: () => void;
}

// Push-to-talk: one phrase per start(). Sends every alternative transcript so
// the caller can pick the first one that is a legal move.
export function useSpeechRecognition(
  onHeard: (alternatives: string[]) => void,
  onError: (message: string) => void,
): SpeechRecognitionState {
  const [supported] = useState(() => recognitionConstructor() !== null);
  const [listening, setListening] = useState(false);
  const recognition = useRef<Recognition | null>(null);

  useEffect(() => () => recognition.current?.abort(), []);

  const start = useCallback(() => {
    const Constructor = recognitionConstructor();
    if (!Constructor) {
      onError('Voice input needs Chrome or Edge. Type your move instead.');
      return;
    }
    recognition.current?.abort();
    const r = new Constructor();
    r.lang = 'en-US';
    r.interimResults = false;
    r.continuous = false;
    r.maxAlternatives = 3;
    r.onresult = (event) => {
      const result = event.results[0];
      const alternatives = Array.from(
        { length: result?.length ?? 0 },
        (_, i) => result?.[i]?.transcript ?? '',
      ).filter(Boolean);
      if (alternatives.length > 0) onHeard(alternatives);
    };
    r.onerror = (event) => {
      if (event.error === 'aborted') return;
      onError(
        ERROR_MESSAGES[event.error] ??
          'Voice input stopped. Try again, or type your move.',
      );
    };
    r.onend = () => setListening(false);
    recognition.current = r;
    setListening(true);
    r.start();
  }, [onHeard, onError]);

  const stop = useCallback(() => recognition.current?.stop(), []);

  return { supported, listening, start, stop };
}
