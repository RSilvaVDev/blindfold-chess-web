import type { EngineLevel } from '../game-session/types';
import { LEVEL_SETTINGS } from './levels';
import type { ChessEngine, EngineMove } from './types';
import { parseUciMove } from './uciMove';

const SEARCH_TIMEOUT_MS = 15_000;

interface Waiter {
  match: RegExp;
  resolve: (line: string) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

// Talks UCI to the Stockfish WASM build running in a Web Worker. Searches run
// one at a time, so a reply always belongs to the position that asked for it.
export class StockfishClient implements ChessEngine {
  readonly name = 'Stockfish';
  private readonly worker: Worker;
  private waiter: Waiter | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private failure: Error | null = null;

  private constructor(scriptUrl: string) {
    this.worker = new Worker(scriptUrl);
    this.worker.onmessage = (event: MessageEvent<unknown>) => {
      if (typeof event.data === 'string') this.handleLine(event.data);
    };
    this.worker.onerror = () => this.fail(new Error('Stockfish worker failed'));
  }

  static async start(
    scriptUrl: string,
    timeoutMs: number,
  ): Promise<StockfishClient> {
    const client = new StockfishClient(scriptUrl);
    try {
      await client.request('uci', /^uciok/, timeoutMs);
      await client.request('isready', /^readyok/, timeoutMs);
      return client;
    } catch (error) {
      client.worker.terminate();
      throw error;
    }
  }

  bestMove = (fen: string, level: EngineLevel): Promise<EngineMove> => {
    const run = async (): Promise<EngineMove> => {
      const { skill, depth, moveTimeMs } = LEVEL_SETTINGS[level];
      this.worker.postMessage(`setoption name Skill Level value ${skill}`);
      this.worker.postMessage(`position fen ${fen}`);
      const line = await this.request(
        `go depth ${depth} movetime ${moveTimeMs}`,
        /^bestmove /,
        SEARCH_TIMEOUT_MS,
      );
      const move = parseUciMove(line.split(' ')[1] ?? '');
      if (!move) throw new Error(`Stockfish returned no move: ${line}`);
      return move;
    };
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => undefined);
    return result;
  };

  private request(
    command: string,
    match: RegExp,
    timeoutMs: number,
  ): Promise<string> {
    if (this.failure) return Promise.reject(this.failure);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => this.fail(new Error(`Stockfish did not answer "${command}"`)),
        timeoutMs,
      );
      this.waiter = { match, resolve, reject, timer };
      this.worker.postMessage(command);
    });
  }

  private handleLine(line: string): void {
    const waiter = this.waiter;
    if (waiter && waiter.match.test(line)) {
      clearTimeout(waiter.timer);
      this.waiter = null;
      waiter.resolve(line);
    }
  }

  private fail(error: Error): void {
    this.failure = error;
    const waiter = this.waiter;
    this.waiter = null;
    if (waiter) {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    }
  }
}
