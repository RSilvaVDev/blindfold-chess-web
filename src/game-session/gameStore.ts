import { Chess, type Color, type Move, type Square } from 'chess.js';
import type { GameStatus } from './types';

export type MoveInput =
  string | { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' };

export interface GameSnapshot {
  fen: string;
  turn: Color;
  history: string[];
  lastMove: Move | null;
  inCheck: boolean;
  status: GameStatus;
  board: ReturnType<Chess['board']>;
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

// Owns the mutable chess.js instance outside React and publishes an immutable
// snapshot after every change, so components read state through
// useSyncExternalStore instead of touching the instance during render.
export class GameStore {
  private readonly chess = new Chess();
  private resignedBy: Color | null = null;
  private listeners = new Set<() => void>();
  private snapshot: GameSnapshot = this.takeSnapshot();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): GameSnapshot => this.snapshot;

  legalMoves = (): Move[] => this.chess.moves({ verbose: true });

  // Returns the applied move, or null when the move is illegal or the game is over.
  play = (move: MoveInput): Move | null => {
    if (this.snapshot.status.kind !== 'active') return null;
    try {
      const applied = this.chess.move(move);
      this.publish();
      return applied;
    } catch {
      // chess.js throws on illegal moves; the caller explains why.
      return null;
    }
  };

  // Undoes up to `plies` half-moves; returns how many were undone.
  undo = (plies: number): number => {
    let undone = 0;
    while (undone < plies && this.chess.undo()) undone++;
    if (undone > 0) {
      this.resignedBy = null;
      this.publish();
    }
    return undone;
  };

  resign = (loser: Color): void => {
    if (this.snapshot.status.kind !== 'active') return;
    this.resignedBy = loser;
    this.publish();
  };

  reset = (): void => {
    this.chess.reset();
    this.resignedBy = null;
    this.publish();
  };

  private publish(): void {
    this.snapshot = this.takeSnapshot();
    this.listeners.forEach((listener) => listener());
  }

  private takeSnapshot(): GameSnapshot {
    return {
      fen: this.chess.fen(),
      turn: this.chess.turn(),
      history: this.chess.history(),
      lastMove: this.chess.history({ verbose: true }).at(-1) ?? null,
      inCheck: this.chess.inCheck(),
      status: statusOf(this.chess, this.resignedBy),
      board: this.chess.board(),
    };
  }
}
