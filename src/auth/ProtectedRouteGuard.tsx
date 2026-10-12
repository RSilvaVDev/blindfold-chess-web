import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './useAuth';

// Layout route: renders the child route only for a signed-in user.
export function ProtectedRouteGuard() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main id="main" aria-busy="true">
        <p role="status">Checking your session…</p>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
