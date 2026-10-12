import type { SpeechRecognitionState } from '../speech/useSpeechRecognition';

interface PushToTalkButtonProps {
  speech: SpeechRecognitionState;
}

// Press once to speak a move; press again to stop early. The typed input is
// always available beside it.
export function PushToTalkButton({ speech }: PushToTalkButtonProps) {
  if (!speech.supported) {
    return (
      <p className="hint">
        Voice input needs Chrome or Edge. Type your move below instead.
      </p>
    );
  }

  return (
    <button
      type="button"
      className={`push-to-talk${speech.listening ? ' listening' : ''}`}
      aria-pressed={speech.listening}
      onClick={speech.listening ? speech.stop : speech.start}
    >
      {speech.listening ? 'Listening… press to stop' : '🎤 Speak a move'}
    </button>
  );
}
