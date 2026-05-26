import { type ReactNode } from 'react';
import { Logo } from '@/components/common/Logo';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex">
      {/* Left — visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[hsl(240_10%_6%)] text-white">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div
          className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle, hsl(245 80% 60%), transparent 60%)' }}
        />
        <div
          className="absolute -bottom-32 -right-32 h-[480px] w-[480px] rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, hsl(190 90% 55%), transparent 60%)' }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Logo className="text-white" />
          <div className="space-y-6 max-w-md">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/50">
              workspace · production-grade
            </p>
            <h2 className="font-display text-5xl font-bold leading-[1.05] tracking-tight">
              Where teams ship,
              <br />
              <span className="gradient-text">together.</span>
            </h2>
            <p className="text-base text-white/70 leading-relaxed">
              Real-time kanban, calendar, analytics, and team workflows — built for fast-moving
              product teams that need clarity, not bloat.
            </p>
            <div className="flex items-center gap-4 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full ring-2 ring-[hsl(240_10%_6%)] bg-gradient-to-br from-indigo-500 to-sky-500"
                  style={{ marginLeft: i === 1 ? 0 : -16 }}
                />
              ))}
              <p className="text-sm text-white/60">
                <span className="text-white font-medium">12,000+</span> teams already on board
              </p>
            </div>
          </div>
          <p className="text-xs text-white/40 font-mono">
            © {new Date().getFullYear()} Project Cloud · v1.0
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md animate-in">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-6 text-sm text-muted-foreground text-center">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
