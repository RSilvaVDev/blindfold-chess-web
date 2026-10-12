import type { Color } from 'chess.js';
import { describeStatus } from '../game-logic/narrator';
import type { GameStatus } from '../game-session/types';

interface GameStatusBarProps {
  status: GameStatus;
  turn: Color;
  inCheck: boolean;
}

export function GameStatusBar({ status, turn, inCheck }: GameStatusBarProps) {
  const check = status.kind === 'active' && inCheck ? ' Check.' : '';
  return (
    <p className="status-bar">
      {describeStatus(status, turn)}
      {check}
    </p>
  );
}
