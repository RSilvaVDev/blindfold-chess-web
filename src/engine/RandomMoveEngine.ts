import { Chess } from 'chess.js';
import type { ChessEngine, EngineMove } from './types';

const THINK_MS = 400;

// Fallback opponent when Stockfish cannot load: plays a random legal move so
// the game loop still works. Ignores the level.
export class RandomMoveEngine implements ChessEngine {
  readonly name = 'Practice opponent (random moves)';

  bestMove = async (fen: string): Promise<EngineMove> => {
    await new Promise((resolve) => setTimeout(resolve, THINK_MS));
    const moves = new Chess(fen).moves({ verbose: true });
    const move = moves[Math.floor(Math.random() * moves.length)];
    if (!move) throw new Error('No legal moves in this position');
    return {
      from: move.from,
      to: move.to,
      ...(move.promotion
        ? { promotion: move.promotion as EngineMove['promotion'] }
        : {}),
    };
  };
}
