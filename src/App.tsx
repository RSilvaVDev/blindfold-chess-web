import { Navigate, createBrowserRouter } from 'react-router';
import { ProtectedRouteGuard } from './auth/ProtectedRouteGuard';
import { AppShell } from './components/AppShell';
import { LoginPage } from './pages/LoginPage';
import { PlayPage } from './pages/PlayPage';
import { SettingsPage } from './pages/SettingsPage';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Navigate to="/play" replace /> },
      { path: '/login', element: <LoginPage /> },
      {
        element: <ProtectedRouteGuard />,
        children: [
          { path: '/play', element: <PlayPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
      { path: '*', element: <Navigate to="/play" replace /> },
    ],
  },
]);
