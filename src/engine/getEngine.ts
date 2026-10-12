import { RandomMoveEngine } from './RandomMoveEngine';
import { StockfishClient } from './StockfishClient';
import type { ChessEngine } from './types';

const STOCKFISH_URL = '/engine/stockfish.js';
const START_TIMEOUT_MS = 10_000;

let engine: Promise<ChessEngine> | undefined;

// One engine for the whole tab, started on first use. If Stockfish fails to
// load, the game falls back to random legal moves instead of stalling.
export function getEngine(): Promise<ChessEngine> {
  engine ??= StockfishClient.start(STOCKFISH_URL, START_TIMEOUT_MS).catch(
    (error: unknown) => {
      console.warn('Stockfish unavailable, using random moves:', error);
      return new RandomMoveEngine();
    },
  );
  return engine;
}
