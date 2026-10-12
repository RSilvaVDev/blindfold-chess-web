import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { AuthResult } from '../auth/authContext';

export type LoginMode = 'sign-in' | 'sign-up';

interface LoginFormProps {
  mode: LoginMode;
  onModeChange(mode: LoginMode): void;
  onSubmit(email: string, password: string): Promise<AuthResult>;
}

export function LoginForm({ mode, onModeChange, onSubmit }: LoginFormProps) {
  const emailId = useId();
  const passwordId = useId();
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Move focus to the error so screen readers announce it immediately.
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await onSubmit(email.trim(), password);
    setSubmitting(false);
    if (!result.ok) setError(result.message);
  }

  const isSignUp = mode === 'sign-up';

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={error ? `${emailId}-error` : undefined}
    >
      <div>
        <label htmlFor={emailId}>Email</label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={passwordId}>Password</label>
        <input
          id={passwordId}
          type="password"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <p id={`${emailId}-error`} role="alert" tabIndex={-1} ref={errorRef}>
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting
          ? isSignUp
            ? 'Creating account…'
            : 'Signing in…'
          : isSignUp
            ? 'Create account'
            : 'Sign in'}
      </button>

      <button
        type="button"
        onClick={() => {
          setError(null);
          onModeChange(isSignUp ? 'sign-in' : 'sign-up');
        }}
      >
        {isSignUp ? 'I already have an account' : 'Create an account instead'}
      </button>
    </form>
  );
}
