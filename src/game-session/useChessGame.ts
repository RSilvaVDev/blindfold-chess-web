import { useState, useSyncExternalStore } from 'react';
import type { Color, Move } from 'chess.js';
import { GameStore, type GameSnapshot, type MoveInput } from './gameStore';

export type { MoveInput } from './gameStore';

export interface ChessGame extends GameSnapshot {
  // The state right now, including changes made since this render (for code
  // that must react to a move it just played).
  latest: () => GameSnapshot;
  legalMoves: () => Move[];
  play: (move: MoveInput) => Move | null;
  undo: (plies: number) => number;
  resign: (loser: Color) => void;
  reset: () => void;
}

// One GameStore per mounted component; games live only in memory.
export function useChessGame(): ChessGame {
  const [store] = useState(() => new GameStore());
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return {
    ...snapshot,
    latest: store.getSnapshot,
    legalMoves: store.legalMoves,
    play: store.play,
    undo: store.undo,
    resign: store.resign,
    reset: store.reset,
  };
}
