import { Chess, type Square } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { normalizeSpeech } from './normalizeSpeech';
import { parseMove } from './parseMove';

describe('spoken phrases end to end', () => {
  it('turns recognizer output into the intended move', () => {
    const chess = new Chess(
      'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    );
    const context = {
      legalMoves: chess.moves({ verbose: true }),
      pieceAt: (square: Square) => chess.get(square) ?? null,
      turn: chess.turn(),
    };
    const play = (heard: string) => {
      const result = parseMove(normalizeSpeech(heard), context);
      return result.kind === 'move' ? result.move.san : result.message;
    };
    expect(play('Bishop on see four to dee five')).toBe('Bd5');
    expect(play('night takes e five')).toBe('Nxe5');
    expect(play('castle king side')).toBe('O-O');
  });
});

describe('normalizeSpeech', () => {
  it('joins spoken letters and numbers into squares', () => {
    expect(normalizeSpeech('bishop on see four to dee five')).toBe(
      'bishop on c4 to d5',
    );
    expect(normalizeSpeech('E2 to E4')).toBe('e2 to e4');
    expect(normalizeSpeech('e 2 to e 4')).toBe('e2 to e4');
    expect(normalizeSpeech('c-4 to d-5')).toBe('c4 to d5');
  });

  it('fixes common mishearings of piece names', () => {
    expect(normalizeSpeech('night to f three')).toBe('knight to f3');
    expect(normalizeSpeech('Knight to F3.')).toBe('knight to f3');
  });

  it('maps sound-alike numbers but keeps "to"', () => {
    expect(normalizeSpeech('pawn to e for')).toBe('pawn to e4');
    expect(normalizeSpeech('queen to h ate')).toBe('queen to h8');
  });

  it('reads castling phrases', () => {
    expect(normalizeSpeech('Castle king side')).toBe('castle kingside');
    expect(normalizeSpeech('castle queen side')).toBe('castle queenside');
  });
});
