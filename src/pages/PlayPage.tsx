import { useEffect, useState } from 'react';
import { ApiError, apiFetch } from '../api/apiClient';
import { useAuth } from '../auth/useAuth';

interface Me {
  id: string;
  email: string | null;
}

export function PlayPage() {
  const { signOut } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Confirms the API accepts this session; the game screen replaces this later.
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
    <main>
      <h1>Blindfold Chess Coach</h1>
      <p role="status">
        {error ?? (me ? `Signed in as ${me.email ?? 'you'}.` : 'Connecting…')}
      </p>
      <p>Play chess by voice. The game screen arrives with the game loop.</p>
      <button type="button" onClick={() => void signOut()}>
        Sign out
      </button>
    </main>
  );
}
