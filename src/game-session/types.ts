import type { Color } from 'chess.js';

export type PlayerColor = Color;

export type EngineLevel = 'easy' | 'medium' | 'hard';

export interface GameSettings {
  playerColor: PlayerColor;
  level: EngineLevel;
}

export type DrawReason =
  | 'stalemate'
  | 'insufficient-material'
  | 'threefold-repetition'
  | 'fifty-move-rule';

export type GameStatus =
  | { kind: 'active' }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'draw'; reason: DrawReason }
  | { kind: 'resigned'; winner: Color };
