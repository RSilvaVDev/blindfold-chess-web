import type { Square } from 'chess.js';
import type { EngineMove } from './types';

const UCI_MOVE = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/;

// Parses UCI long algebraic notation ("e2e4", "e7e8q").
export function parseUciMove(text: string): EngineMove | null {
  const match = UCI_MOVE.exec(text);
  if (!match) return null;
  const [, from, to, promotion] = match;
  return {
    from: from as Square,
    to: to as Square,
    ...(promotion ? { promotion: promotion as EngineMove['promotion'] } : {}),
  };
}
