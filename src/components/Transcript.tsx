import { useEffect, useRef } from 'react';
import type { TranscriptEntry } from '../game-session/sessionReducer';

const LABEL: Record<TranscriptEntry['kind'], string> = {
  you: 'You',
  app: 'Coach',
  flag: 'Coach',
};

interface TranscriptProps {
  entries: TranscriptEntry[];
}

// The visible log. Not a live region: AnnouncementRegion already speaks each
// message, and announcing it twice would talk over the player.
export function Transcript({ entries }: TranscriptProps) {
  const endRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [entries.length]);

  return (
    <section className="transcript" aria-labelledby="transcript-heading">
      <h2 id="transcript-heading">Transcript</h2>
      <ol>
        {entries.map((entry, index) => (
          <li
            key={entry.id}
            className={`entry entry-${entry.kind}`}
            ref={index === entries.length - 1 ? endRef : undefined}
          >
            <span className="entry-label">{LABEL[entry.kind]}:</span>{' '}
            {entry.text}
          </li>
        ))}
      </ol>
    </section>
  );
}
