import type { Color, Move, PieceSymbol, Square } from 'chess.js';

// Turns what a player typed or said into exactly one legal move, or a reason
// it can't. Accepts plain phrases ("bishop on c4 to d5", "knight to f3",
// "castle kingside") as well as algebraic notation ("Nf3", "e2e4").

export interface BoardPiece {
  type: PieceSymbol;
  color: Color;
}

export interface ParseContext {
  legalMoves: Move[];
  pieceAt: (square: Square) => BoardPiece | null;
  turn: Color;
}

export type ParseResult =
  { kind: 'move'; move: Move } | { kind: 'flag'; message: string };

const PIECE_WORDS: Record<string, PieceSymbol> = {
  pawn: 'p',
  pawns: 'p',
  knight: 'n',
  knights: 'n',
  bishop: 'b',
  bishops: 'b',
  rook: 'r',
  rooks: 'r',
  castle: 'r',
  queen: 'q',
  queens: 'q',
  king: 'k',
};

const PIECE_NAME: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

const CAPTURE_WORDS = new Set(['takes', 'take', 'captures', 'capture', 'x']);
const COLOR_NAME: Record<Color, string> = { w: 'White', b: 'Black' };

export const MOVE_EXAMPLES =
  'Try a move like bishop on c4 to d5, knight to f3, castle kingside, or e4.';

const plural = (piece: PieceSymbol) =>
  piece === 'k' ? 'king' : `${PIECE_NAME[piece]}s`;

function listSquares(squares: string[]): string {
  if (squares.length <= 2) return squares.join(' and ');
  return `${squares.slice(0, -1).join(', ')}, and ${squares.at(-1)}`;
}

function bySan(text: string, moves: Move[]): Move | null {
  const clean = (s: string) => s.replace(/[+#!?]/g, '').replace(/0/g, 'O');
  const target = clean(text.trim());
  return (
    moves.find((m) => clean(m.san) === target) ??
    moves.find((m) => m.lan === target.toLowerCase()) ??
    null
  );
}

function parseCastle(words: string[], moves: Move[]): ParseResult | null {
  if (
    !words.some((w) => w === 'castle' || w === 'castles' || w === 'castling')
  ) {
    return null;
  }
  // "castle" alone could also be the rook's old name; only treat it as
  // castling when no square is mentioned.
  if (words.some((w) => /^[a-h][1-8]$/.test(w))) return null;

  const kingside = words.some(
    (w) => w === 'kingside' || w === 'short' || w === 'king',
  );
  const queenside = words.some(
    (w) => w === 'queenside' || w === 'long' || w === 'queen',
  );
  const options = moves.filter(
    (m) => m.isKingsideCastle() || m.isQueensideCastle(),
  );

  if (kingside || queenside) {
    const side = kingside ? 'kingside' : 'queenside';
    const move = options.find((m) =>
      kingside ? m.isKingsideCastle() : m.isQueensideCastle(),
    );
    return move
      ? { kind: 'move', move }
      : { kind: 'flag', message: `You can't castle ${side} right now.` };
  }
  if (options.length === 1) return { kind: 'move', move: options[0] };
  if (options.length === 0)
    return { kind: 'flag', message: "You can't castle right now." };
  return {
    kind: 'flag',
    message:
      'Castle kingside or queenside? Say castle kingside or castle queenside.',
  };
}

export function parseMove(input: string, ctx: ParseContext): ParseResult {
  const raw = input.trim();
  if (!raw)
    return { kind: 'flag', message: `Say or type a move. ${MOVE_EXAMPLES}` };

  // Algebraic notation first: it is exact and case-sensitive ("Bc4" vs "bc4").
  const notation = bySan(raw, ctx.legalMoves);
  if (notation) return { kind: 'move', move: notation };

  const words = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const castle = parseCastle(words, ctx.legalMoves);
  if (castle) return castle;

  const squareIndexes = words
    .map((w, i) => (/^[a-h][1-8]$/.test(w) ? i : -1))
    .filter((i) => i >= 0);
  if (squareIndexes.length === 0) {
    return {
      kind: 'flag',
      message: `I didn't catch a square. ${MOVE_EXAMPLES}`,
    };
  }

  const destIndex = squareIndexes.at(-1)!;
  const to = words[destIndex] as Square;
  const from =
    squareIndexes.length >= 2 ? (words[squareIndexes[0]] as Square) : null;
  const firstSquare = squareIndexes[0];
  const captureIndex = words.findIndex((w) => CAPTURE_WORDS.has(w));
  const capture = captureIndex >= 0;

  // Moving piece: a piece word before the first square and before "takes".
  const moverLimit = capture
    ? Math.min(captureIndex, firstSquare)
    : firstSquare;
  const moverWord = words.slice(0, moverLimit).find((w) => w in PIECE_WORDS);
  const mover = moverWord ? PIECE_WORDS[moverWord] : null;

  // Captured piece: "knight takes pawn on e5".
  const capturedWord = capture
    ? words.slice(captureIndex + 1, destIndex).find((w) => w in PIECE_WORDS)
    : undefined;
  const captured = capturedWord ? PIECE_WORDS[capturedWord] : null;

  // Promotion: a piece word after the destination ("e7 to e8 queen").
  const afterDest = words.slice(destIndex + 1);
  const promoteWord = afterDest.find((w) => w in PIECE_WORDS && w !== 'castle');
  const promotion = promoteWord ? PIECE_WORDS[promoteWord] : null;

  let candidates = ctx.legalMoves.filter(
    (m) =>
      m.to === to &&
      (!from || m.from === from) &&
      (!mover || m.piece === mover) &&
      (!capture || m.captured !== undefined) &&
      (!captured || m.captured === captured) &&
      (!promotion || m.promotion === promotion),
  );

  // A bare destination ("e4") means a pawn move, as in chess notation.
  if (!mover && !from && candidates.some((m) => m.piece === 'p')) {
    candidates = candidates.filter((m) => m.piece === 'p');
  }

  if (candidates.length === 1) return { kind: 'move', move: candidates[0] };

  if (candidates.length > 1) {
    // Sorted so the spoken list is predictable (b1 before f3).
    const origins = [...new Set(candidates.map((m) => m.from))].sort();
    if (origins.length === 1) {
      return {
        kind: 'flag',
        message: `Promote to which piece? Say ${origins[0]} to ${to} queen, rook, bishop, or knight.`,
      };
    }
    const piece = mover ?? candidates[0].piece;
    const same = candidates.every((m) => m.piece === piece);
    const who = same ? plural(piece) : 'pieces';
    return {
      kind: 'flag',
      message: `${origins.length === 2 ? 'Two' : 'Several'} ${who} can reach ${to}, on ${listSquares(origins)}. Say which one, like ${PIECE_NAME[candidates[0].piece]} on ${origins[0]} to ${to}.`,
    };
  }

  return { kind: 'flag', message: explain({ ctx, from, to, mover, capture }) };
}

function explain(args: {
  ctx: ParseContext;
  from: Square | null;
  to: Square;
  mover: PieceSymbol | null;
  capture: boolean;
}): string {
  const { ctx, from, to, mover, capture } = args;
  const target = ctx.pieceAt(to);

  if (from) {
    const piece = ctx.pieceAt(from);
    if (!piece) return `There's no piece on ${from}.`;
    if (piece.color !== ctx.turn) {
      return `The ${PIECE_NAME[piece.type]} on ${from} is ${COLOR_NAME[piece.color]}'s. You play ${COLOR_NAME[ctx.turn]}.`;
    }
    if (mover && piece.type !== mover) {
      return `The piece on ${from} is a ${PIECE_NAME[piece.type]}, not a ${PIECE_NAME[mover]}.`;
    }
    if (capture && !target) return `There's nothing to take on ${to}.`;
    if (target && target.color === ctx.turn) {
      return `Your own ${PIECE_NAME[target.type]} is on ${to}.`;
    }
    return `The ${PIECE_NAME[piece.type]} on ${from} can't move to ${to}.`;
  }

  if (capture && !target) return `There's nothing to take on ${to}.`;
  if (target && target.color === ctx.turn) {
    return `Your own ${PIECE_NAME[target.type]} is on ${to}.`;
  }
  if (mover) return `None of your ${plural(mover)} can reach ${to}.`;
  return `None of your pieces can reach ${to}. ${MOVE_EXAMPLES}`;
}
