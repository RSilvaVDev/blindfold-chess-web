import { useEffect, useRef, useState } from 'react';
import { AudioQueue } from './AudioQueue';

interface Line {
  id: number;
  text: string;
}

// Speaks each new announcement once, in order. Keyed by id so a repeated
// message (the same flag twice) is spoken again.
export function useSpeaker(line: Line | null): void {
  const [queue] = useState(() => new AudioQueue());
  const lastSpoken = useRef<number | null>(null);

  useEffect(() => {
    if (!line || line.id === lastSpoken.current) return;
    lastSpoken.current = line.id;
    queue.speak(line.text);
  }, [line, queue]);

  useEffect(() => () => queue.clear(), [queue]);
}
