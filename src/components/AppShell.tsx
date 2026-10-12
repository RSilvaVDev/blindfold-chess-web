import { Outlet } from 'react-router';

// Shared layout for every route. The skip link lets keyboard and screen reader
// users jump straight past repeated content to the page's main region.
export function AppShell() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <Outlet />
    </>
  );
}
