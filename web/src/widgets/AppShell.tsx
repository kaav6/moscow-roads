import { Outlet } from 'react-router-dom';
import { Rail } from './Rail';
import { Topbar } from './Topbar';

export function AppShell() {
  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: 'var(--tp-bg-app)' }}
    >
      <div className="flex flex-1 min-h-0">
        <Rail />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 min-h-0 p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
