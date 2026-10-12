// The game transcript: what the player entered, what the app said, and what it
// flagged. Every app message here is also announced through the live region.

export type EntryKind = 'you' | 'app' | 'flag';

export interface TranscriptEntry {
  id: number;
  kind: EntryKind;
  text: string;
}

export interface SessionState {
  entries: TranscriptEntry[];
  nextId: number;
}

export type SessionAction =
  { type: 'append'; kind: EntryKind; text: string } | { type: 'reset' };

export const initialSession: SessionState = { entries: [], nextId: 1 };

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case 'append':
      return {
        entries: [
          ...state.entries,
          { id: state.nextId, kind: action.kind, text: action.text },
        ],
        nextId: state.nextId + 1,
      };
    case 'reset':
      return initialSession;
  }
}
