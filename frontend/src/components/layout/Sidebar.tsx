import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Calendar,
  Settings,
  Shield,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/common/Logo';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore, userRoleName } from '@/store/auth.store';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/admin', label: 'Admin', icon: Shield, adminOnly: true },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const role = userRoleName(user);

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-xl transition-[width] duration-300',
          sidebarCollapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-16 px-4 border-b border-border', sidebarCollapsed && 'justify-center px-2')}>
          <Logo collapsed={sidebarCollapsed} />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems
            .filter((item) => !item.adminOnly || role === 'ADMIN')
            .map((item) => {
              const Icon = item.icon;
              const link = (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      'hover:bg-accent/60 text-muted-foreground hover:text-foreground',
                      isActive &&
                        'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary shadow-[inset_2px_0_0_hsl(var(--primary))]',
                      sidebarCollapsed && 'justify-center px-0',
                    )
                  }
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
              return sidebarCollapsed ? (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                link
              );
            })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-border">
          <button
            type="button"
            onClick={toggleSidebar}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronsRight className="h-4 w-4 mx-auto" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
