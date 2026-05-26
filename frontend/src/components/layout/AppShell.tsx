import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';

export function AppShell() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  useSocket();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          'min-h-screen transition-[padding-left] duration-300',
          sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-64',
        )}
      >
        <Topbar />
        <main className="px-4 py-6 lg:px-8 lg:py-8 animate-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
