import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthError, Session } from '@supabase/supabase-js';
import {
  AuthContext,
  SESSION_EXPIRED_EVENT,
  type AuthResult,
  type AuthState,
} from './authContext';
import { getSupabase } from './supabaseClient';

// Supabase error codes mapped to messages that work read aloud as well as on screen.
function describe(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return "That email and password don't match. Try again.";
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with that email already exists. Sign in instead.';
    case 'weak_password':
      return 'Choose a longer password, at least 8 characters.';
    case 'email_not_confirmed':
      return 'Confirm your email address, then sign in.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many attempts. Wait a minute and try again.';
    default:
      return error.message || 'Sign-in failed. Try again.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        setSession(next);
        setLoading(false);
      },
    );

    // apiClient fires this on a 401: drop the stale session and say why.
    const onExpired = () => {
      setNotice('Your session expired. Sign in again.');
      void supabase.auth.signOut();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { error } = await getSupabase().auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { ok: false, message: describe(error) };
      setNotice(null);
      return { ok: true };
    },
    [],
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
      });
      if (error) return { ok: false, message: describe(error) };
      // No session means the project still requires email confirmation.
      if (!data.session) {
        return {
          ok: false,
          message: 'Check your email to confirm your account, then sign in.',
        };
      }
      setNotice(null);
      return { ok: true };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
  }, []);

  const value = useMemo<AuthState>(
    () => ({ session, loading, notice, signIn, signUp, signOut }),
    [session, loading, notice, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
