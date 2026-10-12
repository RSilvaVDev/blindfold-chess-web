import { useCallback, useMemo, useRef, useState } from 'react';
import { Chess, type Color, type Move, type Square } from 'chess.js';
import type { GameStatus } from './types';

export type MoveInput =
  string | { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' };

export interface ChessGame {
  fen: string;
  turn: Color;
  history: string[];
  lastMove: Move | null;
  inCheck: boolean;
  status: GameStatus;
  board: ReturnType<Chess['board']>;
  legalMoves(): Move[];
  // Returns the applied move, or null when the move is illegal or the game is over.
  play(move: MoveInput): Move | null;
  // Undoes up to `plies` half-moves; returns how many were undone.
  undo(plies: number): number;
  resign(loser: Color): void;
  reset(): void;
}

const opponent = (color: Color): Color => (color === 'w' ? 'b' : 'w');

function statusOf(chess: Chess, resignedBy: Color | null): GameStatus {
  if (resignedBy) return { kind: 'resigned', winner: opponent(resignedBy) };
  // The side to move is the side that got mated.
  if (chess.isCheckmate())
    return { kind: 'checkmate', winner: opponent(chess.turn()) };
  if (chess.isStalemate()) return { kind: 'draw', reason: 'stalemate' };
  if (chess.isInsufficientMaterial())
    return { kind: 'draw', reason: 'insufficient-material' };
  if (chess.isThreefoldRepetition())
    return { kind: 'draw', reason: 'threefold-repetition' };
  if (chess.isDrawByFiftyMoves())
    return { kind: 'draw', reason: 'fifty-move-rule' };
  return { kind: 'active' };
}

// chess.js owns the rules; this hook keeps one instance per game and re-renders
// after every change. Games live only in memory.
export function useChessGame(): ChessGame {
  const chessRef = useRef<Chess | null>(null);
  chessRef.current ??= new Chess();
  const [version, setVersion] = useState(0);
  const [resignedBy, setResignedBy] = useState<Color | null>(null);
  const bump = () => setVersion((v) => v + 1);

  const snapshot = useMemo(() => {
    const chess = chessRef.current!;
    const verbose = chess.history({ verbose: true });
    return {
      fen: chess.fen(),
      turn: chess.turn(),
      history: chess.history(),
      lastMove: verbose.at(-1) ?? null,
      inCheck: chess.inCheck(),
      status: statusOf(chess, resignedBy),
      board: chess.board(),
    };
    // `version` is the change signal for the mutable chess.js instance.
  }, [version, resignedBy]);

  const legalMoves = useCallback(
    () => chessRef.current!.moves({ verbose: true }),
    [],
  );

  const play = useCallback(
    (move: MoveInput): Move | null => {
      const chess = chessRef.current!;
      if (resignedBy || chess.isGameOver()) return null;
      try {
        const applied = chess.move(move);
        bump();
        return applied;
      } catch {
        // chess.js throws on illegal moves; the caller explains why.
        return null;
      }
    },
    [resignedBy],
  );

  const undo = useCallback((plies: number): number => {
    const chess = chessRef.current!;
    let undone = 0;
    while (undone < plies && chess.undo()) undone++;
    if (undone > 0) {
      setResignedBy(null);
      bump();
    }
    return undone;
  }, []);

  const resign = useCallback((loser: Color) => setResignedBy(loser), []);

  const reset = useCallback(() => {
    chessRef.current!.reset();
    setResignedBy(null);
    bump();
  }, []);

  return { ...snapshot, legalMoves, play, undo, resign, reset };
}
