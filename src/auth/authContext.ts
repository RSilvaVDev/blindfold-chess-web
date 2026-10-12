import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export type AuthResult = { ok: true } | { ok: false; message: string };

export interface AuthState {
  session: Session | null;
  // True until the stored session has been read, so guards don't redirect early.
  loading: boolean;
  // Set when the API rejected the session; shown on the login page.
  notice: string | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export const SESSION_EXPIRED_EVENT = 'auth:session-expired';
