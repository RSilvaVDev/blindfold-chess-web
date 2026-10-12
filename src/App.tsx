import { Navigate, createBrowserRouter } from 'react-router';
import { LoginPage } from './pages/LoginPage';
import { PlayPage } from './pages/PlayPage';
import { SettingsPage } from './pages/SettingsPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/play" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/play', element: <PlayPage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '*', element: <Navigate to="/play" replace /> },
]);
