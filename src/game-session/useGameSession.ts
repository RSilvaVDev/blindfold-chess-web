import { useCallback, useReducer, useState } from 'react';
import type { Move, Square } from 'chess.js';
import {
  COLOR_NAME,
  describeMove,
  describeStatus,
} from '../game-logic/narrator';
import {
  initialSession,
  sessionReducer,
  type TranscriptEntry,
} from './sessionReducer';
import type { GameSettings } from './types';
import { normalizeSpeech } from '../game-logic/normalizeSpeech';
import { MOVE_EXAMPLES, parseMove } from '../game-logic/parseMove';
import { useChessGame, type ChessGame } from './useChessGame';
import { useEngineTurn, type EngineTurn } from './useEngineTurn';
import { useLeaveWarning } from './useLeaveWarning';

export interface GameSession {
  game: ChessGame;
  settings: GameSettings | null;
  engine: EngineTurn;
  transcript: TranscriptEntry[];
  // The newest app message, for the live region; null until the app speaks.
  announcement: TranscriptEntry | null;
  start: (settings: GameSettings) => void;
  // Returns true when the input was played, so the field can clear.
  submit: (text: string) => boolean;
  // Speech recognition alternatives, best first.
  submitSpoken: (alternatives: string[]) => void;
  // Reports a voice-input problem (mic blocked, nothing heard).
  voiceError: (message: string) => void;
  leave: () => void;
}

// The only place that changes game state in response to input. Components send
// input here and render what it returns.
export function useGameSession(): GameSession {
  const game = useChessGame();
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [session, dispatch] = useReducer(sessionReducer, initialSession);
  const { latest } = game;

  const say = useCallback(
    (text: string) => dispatch({ type: 'append', kind: 'app', text }),
    [],
  );
  const flag = useCallback(
    (text: string) => dispatch({ type: 'append', kind: 'flag', text }),
    [],
  );

  // Announces a move, then the result if that move ended the game.
  const narrate = useCallback(
    (move: Move, mover: 'you' | Move['color']) => {
      say(describeMove(move, mover));
      const now = latest();
      if (now.status.kind !== 'active')
        say(describeStatus(now.status, now.turn));
    },
    [latest, say],
  );

  const onEngineMove = useCallback(
    (move: Move) => narrate(move, move.color),
    [narrate],
  );
  const engine = useEngineTurn(game, settings, onEngineMove);

  const start = useCallback(
    (next: GameSettings) => {
      game.reset();
      dispatch({ type: 'reset' });
      setSettings(next);
      say(
        next.playerColor === 'w'
          ? `New game. You play White at ${next.level} level. Your move.`
          : `New game. You play Black at ${next.level} level. The engine moves first.`,
      );
    },
    [game, say],
  );

  // Plays the first candidate that is a legal move; otherwise flags why the
  // first one can't be played. Typed input has one candidate; speech has the
  // recognizer's alternatives.
  const attempt = useCallback(
    (candidates: string[], shown: string): boolean => {
      if (!settings) return false;
      if (candidates.every((c) => !c.trim())) {
        flag(`Type or say a move. ${MOVE_EXAMPLES}`);
        return false;
      }
      dispatch({ type: 'append', kind: 'you', text: shown });

      const now = latest();
      if (now.status.kind !== 'active') {
        flag('The game is over. Start a new game from the menu.');
        return false;
      }
      if (now.turn !== settings.playerColor) {
        flag(`It's ${COLOR_NAME[now.turn]}'s turn. Wait for the reply.`);
        return false;
      }

      const context = {
        legalMoves: game.legalMoves(),
        pieceAt: (square: Square) =>
          now.board.flat().find((cell) => cell?.square === square) ?? null,
        turn: now.turn,
      };
      const results = candidates.map((c) => parseMove(c, context));
      const found = results.find((r) => r.kind === 'move');
      if (!found) {
        const first = results[0];
        flag(first?.kind === 'flag' ? first.message : MOVE_EXAMPLES);
        return false;
      }
      const move = game.play({
        from: found.move.from,
        to: found.move.to,
        ...(found.move.promotion
          ? { promotion: found.move.promotion as 'q' | 'r' | 'b' | 'n' }
          : {}),
      });
      if (!move) {
        flag(`That move isn't legal here. ${MOVE_EXAMPLES}`);
        return false;
      }
      narrate(move, 'you');
      return true;
    },
    [settings, flag, latest, game, narrate],
  );

  const submit = useCallback(
    (raw: string): boolean => attempt([raw.trim()], raw.trim()),
    [attempt],
  );

  const submitSpoken = useCallback(
    (alternatives: string[]): void => {
      attempt(
        alternatives.map(normalizeSpeech),
        `(said) ${alternatives[0] ?? ''}`,
      );
    },
    [attempt],
  );

  const leave = useCallback(() => {
    setSettings(null);
    dispatch({ type: 'reset' });
  }, []);

  useLeaveWarning(
    settings !== null &&
      game.status.kind === 'active' &&
      game.history.length > 0,
  );

  const announcement =
    [...session.entries].reverse().find((entry) => entry.kind !== 'you') ??
    null;

  return {
    game,
    settings,
    engine,
    transcript: session.entries,
    announcement,
    start,
    submit,
    submitSpoken,
    voiceError: flag,
    leave,
  };
}
