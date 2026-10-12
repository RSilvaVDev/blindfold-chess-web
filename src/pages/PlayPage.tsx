import { useEffect, useState } from 'react';
import { ApiError, apiFetch } from '../api/apiClient';
import { useAuth } from '../auth/useAuth';
import { BoardView } from '../components/BoardView';
import { NewGameForm } from '../components/NewGameForm';
import type { GameSettings, GameStatus } from '../game-session/types';
import { useChessGame } from '../game-session/useChessGame';

interface Me {
  id: string;
  email: string | null;
}

const COLOR_NAME = { w: 'White', b: 'Black' } as const;

function describeStatus(status: GameStatus, turnName: string): string {
  switch (status.kind) {
    case 'active':
      return `${turnName} to move.`;
    case 'checkmate':
      return `Checkmate. ${COLOR_NAME[status.winner]} wins.`;
    case 'resigned':
      return `Resigned. ${COLOR_NAME[status.winner]} wins.`;
    case 'draw':
      return `Draw by ${status.reason.replace(/-/g, ' ')}.`;
  }
}

export function PlayPage() {
  const { signOut } = useAuth();
  const game = useChessGame();
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Confirms the API accepts this session.
  useEffect(() => {
    let active = true;
    apiFetch<Me>('/me')
      .then((user) => active && setMe(user))
      .catch((e: unknown) => {
        if (active && !(e instanceof ApiError && e.status === 401)) {
          setError(e instanceof Error ? e.message : 'Something went wrong.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function startGame(next: GameSettings) {
    game.reset();
    setSettings(next);
  }

  return (
    <main>
      <h1>Blindfold Chess Coach</h1>
      <p role="status">
        {error ?? (me ? `Signed in as ${me.email ?? 'you'}.` : 'Connecting…')}
      </p>

      {settings ? (
        <section aria-labelledby="game-heading">
          <h2 id="game-heading">
            You play {COLOR_NAME[settings.playerColor]}, {settings.level} level
          </h2>
          <p>{describeStatus(game.status, COLOR_NAME[game.turn])}</p>
          <BoardView
            board={game.board}
            orientation={settings.playerColor}
            lastMove={game.lastMove}
          />
          <button type="button" onClick={() => setSettings(null)}>
            New game
          </button>
        </section>
      ) : (
        <section aria-labelledby="new-game-heading">
          <h2 id="new-game-heading">New game</h2>
          <NewGameForm onStart={startGame} />
        </section>
      )}

      <button type="button" onClick={() => void signOut()}>
        Sign out
      </button>
    </main>
  );
}
