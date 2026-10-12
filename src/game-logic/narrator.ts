import type { Color, Move, PieceSymbol } from 'chess.js';
import type { GameStatus } from '../game-session/types';

// Pure text builders for everything the app says about the game. Sentences are
// written to be read aloud: full piece names, no chess notation symbols.

const PIECE: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

export const COLOR_NAME: Record<Color, string> = { w: 'White', b: 'Black' };

export type Speaker = 'you' | Color;

function subject(speaker: Speaker): {
  name: string;
  plays: string;
  castles: string;
} {
  return speaker === 'you'
    ? { name: 'You', plays: 'play', castles: 'castle' }
    : { name: COLOR_NAME[speaker], plays: 'plays', castles: 'castles' };
}

// "White plays knight to f3." / "Black plays queen takes pawn on f2, checkmate."
export function describeMove(move: Move, speaker: Speaker): string {
  const who = subject(speaker);
  let text: string;

  if (move.isKingsideCastle() || move.isQueensideCastle()) {
    const side = move.isKingsideCastle() ? 'kingside' : 'queenside';
    text = `${who.name} ${who.castles} ${side}`;
  } else if (move.captured) {
    const enPassant = move.isEnPassant() ? ' en passant' : '';
    text = `${who.name} ${who.plays} ${PIECE[move.piece]} takes ${PIECE[move.captured]}${enPassant} on ${move.to}`;
  } else {
    text = `${who.name} ${who.plays} ${PIECE[move.piece]} to ${move.to}`;
  }

  if (move.promotion) text += `, promotes to ${PIECE[move.promotion]}`;
  if (move.san.endsWith('#')) text += ', checkmate';
  else if (move.san.endsWith('+')) text += ', check';
  return `${text}.`;
}

// "White to move." / "Checkmate. Black wins." / "Draw by stalemate."
export function describeStatus(status: GameStatus, turn: Color): string {
  switch (status.kind) {
    case 'active':
      return `${COLOR_NAME[turn]} to move.`;
    case 'checkmate':
      return `Checkmate. ${COLOR_NAME[status.winner]} wins.`;
    case 'resigned':
      return `${COLOR_NAME[status.winner === 'w' ? 'b' : 'w']} resigned. ${COLOR_NAME[status.winner]} wins.`;
    case 'draw':
      return `Draw by ${status.reason.replace(/-/g, ' ')}.`;
  }
}
