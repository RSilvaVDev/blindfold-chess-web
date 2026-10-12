// Turns what speech recognition heard into text parseMove understands:
// "bishop on see four to dee five" -> "bishop on c4 to d5",
// "night to f three" -> "knight to f3".

const WORD_MAP: Record<string, string> = {
  // Piece names recognizers often mishear.
  night: 'knight',
  nite: 'knight',
  knite: 'knight',
  horse: 'knight',
  bishops: 'bishop',
  // File letters spoken as words.
  ay: 'a',
  bee: 'b',
  be: 'b',
  see: 'c',
  sea: 'c',
  cee: 'c',
  dee: 'd',
  ee: 'e',
  eff: 'f',
  gee: 'g',
  jee: 'g',
  aitch: 'h',
  // Rank numbers spoken as words. "to" is left alone: it joins two squares.
  one: '1',
  won: '1',
  two: '2',
  three: '3',
  four: '4',
  for: '4',
  fore: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  ate: '8',
};

export function normalizeSpeech(heard: string): string {
  const words = heard
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\bking side\b/g, 'kingside')
    .replace(/\bqueen side\b/g, 'queenside')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => WORD_MAP[word] ?? word);

  return (
    words
      .join(' ')
      // "c 4" -> "c4", and a recognizer's "c-4" -> "c4".
      .replace(/\b([a-h])[\s-]+([1-8])\b/g, '$1$2')
      .trim()
  );
}
