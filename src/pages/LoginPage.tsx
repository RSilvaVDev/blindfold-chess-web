import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/useAuth';
import { LoginForm, type LoginMode } from '../components/LoginForm';

function returnPath(state: unknown): string {
  if (state && typeof state === 'object' && 'from' in state) {
    const from = state.from;
    if (typeof from === 'string' && from.startsWith('/') && from !== '/login') {
      return from;
    }
  }
  return '/play';
}

export function LoginPage() {
  const { session, loading, notice, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<LoginMode>('sign-in');
  const destination = returnPath(location.state);

  if (!loading && session) {
    return <Navigate to={destination} replace />;
  }

  const submit = mode === 'sign-in' ? signIn : signUp;

  return (
    <main id="main">
      <h1>{mode === 'sign-in' ? 'Sign in' : 'Create an account'}</h1>
      <p>Blindfold Chess Coach: play chess by voice, with no board needed.</p>
      {notice && <p role="status">{notice}</p>}
      <LoginForm
        mode={mode}
        onModeChange={setMode}
        onSubmit={async (email, password) => {
          const result = await submit(email, password);
          if (result.ok) void navigate(destination, { replace: true });
          return result;
        }}
      />
    </main>
  );
}
