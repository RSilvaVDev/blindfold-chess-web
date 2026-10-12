import { useCallback, useReducer, useState } from 'react';
import type { Move } from 'chess.js';
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

  const submit = useCallback(
    (raw: string): boolean => {
      const text = raw.trim();
      if (!settings) return false;
      if (!text) {
        flag('Type a move like e4 or Nf3.');
        return false;
      }
      dispatch({ type: 'append', kind: 'you', text });

      const now = latest();
      if (now.status.kind !== 'active') {
        flag('The game is over. Start a new game from the menu.');
        return false;
      }
      if (now.turn !== settings.playerColor) {
        flag(`It's ${COLOR_NAME[now.turn]}'s turn. Wait for the reply.`);
        return false;
      }

      const move = game.play(text);
      if (!move) {
        flag(`${text} isn't a legal move here. Try a move like e4 or Nf3.`);
        return false;
      }
      narrate(move, 'you');
      return true;
    },
    [settings, flag, latest, game, narrate],
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
    leave,
  };
}
