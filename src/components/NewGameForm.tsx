import { useState, type FormEvent } from 'react';
import type {
  EngineLevel,
  GameSettings,
  PlayerColor,
} from '../game-session/types';

const COLORS: { value: PlayerColor; label: string }[] = [
  { value: 'w', label: 'White (you move first)' },
  { value: 'b', label: 'Black (the engine moves first)' },
];

const LEVELS: { value: EngineLevel; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

interface NewGameFormProps {
  onStart: (settings: GameSettings) => void;
}

export function NewGameForm({ onStart }: NewGameFormProps) {
  const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
  const [level, setLevel] = useState<EngineLevel>('medium');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onStart({ playerColor, level });
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Play as</legend>
        {COLORS.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name="player-color"
              value={option.value}
              checked={playerColor === option.value}
              onChange={() => setPlayerColor(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Engine level</legend>
        {LEVELS.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name="engine-level"
              value={option.value}
              checked={level === option.value}
              onChange={() => setLevel(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <button type="submit">Start game</button>
    </form>
  );
}
