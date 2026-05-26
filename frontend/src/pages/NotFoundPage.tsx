import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/Logo';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-background">
      {/* glow */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[600px] rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, hsl(245 80% 60%), transparent 60%)' }}
      />
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="relative max-w-xl text-center animate-in">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-4">
          Error · 404
        </p>
        <h1 className="font-display text-6xl sm:text-8xl font-bold tracking-tight">
          <span className="gradient-text">Lost</span> in the cloud
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed max-w-md mx-auto">
          The page you're looking for has drifted away. Let's get you back to familiar ground.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="gradient" size="lg" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/projects">
              <Compass className="h-4 w-4" />
              Explore projects
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
