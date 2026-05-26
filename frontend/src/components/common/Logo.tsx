import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  collapsed?: boolean;
}

export function Logo({ className, collapsed = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 blur-md opacity-60" />
        <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 grid place-items-center text-white font-bold shadow-lg">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path
              d="M5 4h7a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6h-3v4H5z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="font-display text-base font-bold tracking-tight leading-none">
            Project<span className="gradient-text">Cloud</span>
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            workspace
          </span>
        </div>
      )}
    </div>
  );
}
