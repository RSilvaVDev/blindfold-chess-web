import type { Chess, Move, PieceSymbol, Color } from 'chess.js';
import type { PlayerColor } from '../game-session/types';

const GLYPHS: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

interface BoardViewProps {
  board: ReturnType<Chess['board']>;
  orientation: PlayerColor;
  lastMove: Move | null;
}

// Visual aid for sighted players and demos. Hidden from screen readers: the
// spoken announcements and board queries are the accessible interface.
export function BoardView({ board, orientation, lastMove }: BoardViewProps) {
  const rows = orientation === 'w' ? board : [...board].reverse();
  const files = orientation === 'w' ? FILES : [...FILES].reverse();

  return (
    <div className="board" aria-hidden="true">
      {rows.map((row, rowIndex) => {
        const cells = orientation === 'w' ? row : [...row].reverse();
        const rank = orientation === 'w' ? 8 - rowIndex : rowIndex + 1;
        return cells.map((piece, colIndex) => {
          const square = `${files[colIndex]}${rank}`;
          const dark = (rank + FILES.indexOf(files[colIndex])) % 2 === 1;
          const highlighted =
            lastMove && (lastMove.from === square || lastMove.to === square);
          return (
            <div
              key={square}
              className={`square ${dark ? 'dark' : 'light'}${highlighted ? ' last-move' : ''}`}
            >
              {piece ? GLYPHS[piece.color][piece.type] : ''}
              {colIndex === 0 && <span className="rank-label">{rank}</span>}
              {rowIndex === 7 && (
                <span className="file-label">{files[colIndex]}</span>
              )}
            </div>
          );
        });
      })}
    </div>
  );
}
