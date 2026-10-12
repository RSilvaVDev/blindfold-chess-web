import { apiFetchBlob } from '../api/apiClient';

// How long to wait for ElevenLabs audio before speaking with the browser voice,
// so speech never holds up the game.
const TTS_TIMEOUT_MS = 4000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

function speakWithBrowser(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

function play(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    const done = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onended = done;
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('playback failed'));
    };
    audio.play().catch((error: unknown) => {
      URL.revokeObjectURL(url);
      reject(error instanceof Error ? error : new Error(String(error)));
    });
  });
}

// Speaks lines one after another so announcements never talk over each other.
// Each line tries ElevenLabs via /tts, then falls back to the browser voice.
export class AudioQueue {
  private tail: Promise<void> = Promise.resolve();

  speak = (text: string): void => {
    // Start fetching now so audio is ready by the time earlier lines finish.
    const audio = withTimeout(
      apiFetchBlob('/tts', { text }),
      TTS_TIMEOUT_MS,
    ).catch(() => null);

    this.tail = this.tail.then(async () => {
      const blob = await audio;
      if (blob) {
        try {
          await play(blob);
          return;
        } catch {
          // Autoplay blocked or decode failed: fall through to the browser voice.
        }
      }
      await speakWithBrowser(text);
    });
  };

  // Drops anything still queued, e.g. when a new game starts.
  clear = (): void => {
    this.tail = Promise.resolve();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };
}
