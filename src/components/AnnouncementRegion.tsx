import type { TranscriptEntry } from '../game-session/sessionReducer';

interface AnnouncementRegionProps {
  announcement: TranscriptEntry | null;
}

// Screen readers announce whatever lands here. Keyed by entry id so a repeated
// message (the same flag twice) is announced again. Visually hidden: the
// transcript shows the same text on screen.
export function AnnouncementRegion({ announcement }: AnnouncementRegionProps) {
  return (
    <div className="sr-only" aria-live="assertive" aria-atomic="true">
      {announcement && <p key={announcement.id}>{announcement.text}</p>}
    </div>
  );
}
