import { useEffect, useState } from 'react';
import { ApiError, apiFetch } from '../api/apiClient';
import { useAuth } from '../auth/useAuth';
import { AnnouncementRegion } from '../components/AnnouncementRegion';
import { BoardView } from '../components/BoardView';
import { GameStatusBar } from '../components/GameStatusBar';
import { MoveInput } from '../components/MoveInput';
import { NewGameForm } from '../components/NewGameForm';
import { Transcript } from '../components/Transcript';
import { COLOR_NAME } from '../game-logic/narrator';
import { useGameSession } from '../game-session/useGameSession';

interface Me {
  id: string;
  email: string | null;
}

export function PlayPage() {
  const { signOut } = useAuth();
  const session = useGameSession();
  const { game, settings, engine } = session;
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

  return (
    <main id="main">
      <h1>Blindfold Chess Coach</h1>
      <p>
        {error ?? (me ? `Signed in as ${me.email ?? 'you'}.` : 'Connecting…')}
      </p>

      <AnnouncementRegion announcement={session.announcement} />

      {settings ? (
        <section aria-labelledby="game-heading">
          <h2 id="game-heading">
            You play {COLOR_NAME[settings.playerColor]}, {settings.level} level
          </h2>
          <GameStatusBar
            status={game.status}
            turn={game.turn}
            inCheck={game.inCheck}
          />
          {engine.engineName && <p>Opponent: {engine.engineName}</p>}
          {engine.thinking && <p>The engine is thinking…</p>}
          {engine.error && <p role="alert">{engine.error}</p>}
          <BoardView
            board={game.board}
            orientation={settings.playerColor}
            lastMove={game.lastMove}
          />
          <MoveInput onSubmit={session.submit} />
          <Transcript entries={session.transcript} />
          <button type="button" onClick={session.leave}>
            New game
          </button>
        </section>
      ) : (
        <section aria-labelledby="new-game-heading">
          <h2 id="new-game-heading">New game</h2>
          <NewGameForm onStart={session.start} />
        </section>
      )}

      <button type="button" onClick={() => void signOut()}>
        Sign out
      </button>
    </main>
  );
}
