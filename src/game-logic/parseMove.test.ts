import { Chess, type Square } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { parseMove, type ParseContext } from './parseMove';

function context(fen?: string): ParseContext {
  const chess = new Chess(fen);
  return {
    legalMoves: chess.moves({ verbose: true }),
    pieceAt: (square: Square) => chess.get(square) ?? null,
    turn: chess.turn(),
  };
}

function san(input: string, fen?: string): string {
  const result = parseMove(input, context(fen));
  if (result.kind !== 'move')
    throw new Error(`expected a move, got: ${result.message}`);
  return result.move.san;
}

function flag(input: string, fen?: string): string {
  const result = parseMove(input, context(fen));
  if (result.kind !== 'flag')
    throw new Error(`expected a flag, got: ${result.move.san}`);
  return result.message;
}

// After 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6: White to move, Bc4 and Nf3 developed.
const ITALIAN =
  'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';

describe('parseMove: plain phrases', () => {
  it('reads "piece on square to square"', () => {
    expect(san('bishop on c4 to d5', ITALIAN)).toBe('Bd5');
    expect(san('Bishop on C4 to D5', ITALIAN)).toBe('Bd5');
    expect(san('bishop c4 to d5', ITALIAN)).toBe('Bd5');
  });

  it('reads "square to square" without naming the piece', () => {
    expect(san('c4 to d5', ITALIAN)).toBe('Bd5');
    expect(san('from e2 to e4')).toBe('e4');
    expect(san('e2 e4')).toBe('e4');
  });

  it('reads "piece to square" when only one such piece can go there', () => {
    expect(san('knight to f3')).toBe('Nf3');
    expect(san('pawn to e4')).toBe('e4');
  });

  it('treats a bare square as a pawn move', () => {
    expect(san('e4')).toBe('e4');
  });

  it('reads captures', () => {
    expect(san('bishop takes f7', ITALIAN)).toBe('Bxf7+');
    expect(san('bishop on c4 takes pawn on f7', ITALIAN)).toBe('Bxf7+');
    expect(san('knight takes e5', ITALIAN)).toBe('Nxe5');
  });

  it('reads castling', () => {
    expect(san('castle kingside', ITALIAN)).toBe('O-O');
    expect(san('castle short', ITALIAN)).toBe('O-O');
    expect(san('castle', ITALIAN)).toBe('O-O');
  });

  it('reads promotion', () => {
    const promo = '8/4P3/8/8/8/8/k7/7K w - - 0 1';
    expect(san('e7 to e8 queen', promo)).toBe('e8=Q');
    expect(san('pawn to e8 knight', promo)).toBe('e8=N');
    expect(flag('pawn to e8', promo)).toMatch(/^Promote to which piece\?/);
  });

  it('still accepts algebraic notation', () => {
    expect(san('Nf3')).toBe('Nf3');
    expect(san('e2e4')).toBe('e4');
    expect(san('O-O', ITALIAN)).toBe('O-O');
    expect(san('0-0', ITALIAN)).toBe('O-O');
  });
});

describe('parseMove: explains what went wrong', () => {
  it('names an empty origin square', () => {
    expect(flag('bishop on c4 to d5')).toBe("There's no piece on c4.");
  });

  it('names the wrong piece on the origin square', () => {
    expect(flag('bishop on b1 to c3')).toBe(
      'The piece on b1 is a knight, not a bishop.',
    );
  });

  it("refuses the opponent's pieces", () => {
    expect(flag('e7 to e5')).toBe("The pawn on e7 is Black's. You play White.");
  });

  it('says when a piece cannot reach the square', () => {
    expect(flag('bishop on c4 to c5', ITALIAN)).toBe(
      "The bishop on c4 can't move to c5.",
    );
    expect(flag('bishop to e4')).toBe('None of your bishops can reach e4.');
    expect(flag('queen to h5', ITALIAN)).toBe(
      'None of your queens can reach h5.',
    );
  });

  it('says when there is nothing to capture', () => {
    expect(flag('knight takes d4', ITALIAN)).toBe(
      "There's nothing to take on d4.",
    );
  });

  it('says when your own piece is in the way', () => {
    expect(flag('rook on h1 to h3')).toBe("The rook on h1 can't move to h3.");
    expect(flag('knight on g1 to e2')).toBe('Your own pawn is on e2.');
  });

  it('asks which piece when two can reach the square', () => {
    // After 1.d4 d5 2.Nf3 Nf6: both knights (b1, f3) can reach d2.
    const twoKnights =
      'rnbqkb1r/ppp1pppp/5n2/3p4/3P4/5N2/PPP1PPPP/RNBQKB1R w KQkq - 2 3';
    expect(flag('knight to d2', twoKnights)).toBe(
      'Two knights can reach d2, on b1 and f3. Say which one, like knight on b1 to d2.',
    );
    expect(san('knight on f3 to d2', twoKnights)).toBe('Nfd2');
  });

  it('refuses castling that is not allowed', () => {
    expect(flag('castle kingside')).toBe(
      "You can't castle kingside right now.",
    );
  });

  it('asks for a square when none was given', () => {
    expect(flag('move my horse')).toMatch(/^I didn't catch a square\./);
    expect(flag('   ')).toMatch(/^Say or type a move\./);
  });
});
