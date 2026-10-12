import { useEffect, useState } from 'react';
import type { Move } from 'chess.js';
import { getEngine } from '../engine/getEngine';
import type { GameSettings } from './types';
import type { ChessGame } from './useChessGame';

const THINKING_NOTICE_MS = 2000;

export interface EngineTurn {
  // True once the engine has been thinking for more than two seconds.
  thinking: boolean;
  engineName: string | null;
  error: string | null;
}

// Plays the engine's reply whenever it is the engine's turn, including the
// first move when the player is Black. A reply for a position that has since
// changed (new game, take back) is dropped. `onMove` must be stable
// (useCallback); it runs after each engine move is applied.
export function useEngineTurn(
  game: ChessGame,
  settings: GameSettings | null,
  onMove: (move: Move) => void,
): EngineTurn {
  // The position the "thinking" notice belongs to, so a cancelled search never
  // leaves the notice showing for the next one.
  const [thinkingFen, setThinkingFen] = useState<string | null>(null);
  const [engineName, setEngineName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { fen, turn, status, play } = game;
  const enginesTurn =
    settings !== null &&
    status.kind === 'active' &&
    turn !== settings.playerColor;
  const level = settings?.level;

  useEffect(() => {
    if (!enginesTurn || !level) return;
    let cancelled = false;
    const notice = setTimeout(() => setThinkingFen(fen), THINKING_NOTICE_MS);

    getEngine()
      .then((engine) => {
        if (!cancelled) setEngineName(engine.name);
        return engine.bestMove(fen, level);
      })
      .then((move) => {
        if (cancelled) return;
        const applied = play(move);
        if (applied) onMove(applied);
        else setError('The engine chose a move that is not legal.');
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'The engine stopped.');
      })
      .finally(() => clearTimeout(notice));

    return () => {
      cancelled = true;
      clearTimeout(notice);
    };
  }, [enginesTurn, fen, level, play, onMove]);

  return { thinking: enginesTurn && thinkingFen === fen, engineName, error };
}
