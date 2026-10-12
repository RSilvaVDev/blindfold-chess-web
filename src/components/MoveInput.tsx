import { useId, useState, type FormEvent } from 'react';

interface MoveInputProps {
  onSubmit: (text: string) => boolean;
}

// Typed moves: the always-available alternative to voice input. Accepts
// algebraic notation for now (e4, Nf3, O-O, e7e8q); spoken phrasing comes later.
export function MoveInput({ onSubmit }: MoveInputProps) {
  const inputId = useId();
  const hintId = useId();
  const [text, setText] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onSubmit(text)) setText('');
  }

  return (
    <form className="move-input" onSubmit={handleSubmit}>
      <label htmlFor={inputId}>Your move</label>
      <div className="move-input-row">
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby={hintId}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit">Play</button>
      </div>
      <p id={hintId} className="hint">
        For example e4, Nf3, exd5, O-O, or e7e8q.
      </p>
    </form>
  );
}
