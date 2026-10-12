import type { Square } from 'chess.js';
import type { EngineLevel } from '../game-session/types';

export interface EngineMove {
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

export interface ChessEngine {
  readonly name: string;
  bestMove: (fen: string, level: EngineLevel) => Promise<EngineMove>;
}
