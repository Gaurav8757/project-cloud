import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Activity,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { dashboardService } from '@/services';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage, getInitials } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth.store';
import { formatRelativeDate, taskStatusMeta } from '@/utils/meta';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import type { TaskStatus } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  TODO: '#94a3b8',
  IN_PROGRESS: '#0ea5e9',
  REVIEW: '#f59e0b',
  COMPLETED: '#10b981',
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => dashboardService.overview(),
  });

  const { data: upcoming } = useQuery({
    queryKey: ['dashboard', 'upcoming'],
    queryFn: () => dashboardService.upcoming(),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const { totals, statusBreakdown, productivity, recentActivity } = data;
  const pieData = statusBreakdown.map((s) => ({
    name: taskStatusMeta[s.status as TaskStatus]?.label ?? s.status,
    value: s._count._all,
    status: s.status,
  }));

  return (
    <div className="space-y-8 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
            Dashboard · Overview
          </p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight">
            Hi {user?.name.split(' ')[0]} <span className="inline-block animate-in">👋</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here's what's happening across your workspace today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/calendar">
              <Activity className="h-4 w-4" />
              Calendar
            </Link>
          </Button>
          <Button variant="gradient" asChild>
            <Link to="/projects">
              <Sparkles className="h-4 w-4" />
              New project
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total projects" value={totals.totalProjects} icon={FolderKanban} tone="primary" />
        <StatCard label="Pending tasks" value={totals.pendingTasks} icon={Clock} tone="info" />
        <StatCard label="Completed" value={totals.completedTasks} icon={CheckCircle2} tone="success" />
        <StatCard label="Overdue" value={totals.overdueTasks} icon={AlertTriangle} tone="destructive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Productivity chart */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Team productivity</CardTitle>
              <CardDescription>Tasks completed over the last 7 days</CardDescription>
            </div>
            <Badge variant="success">
              <TrendingUp className="h-3 w-3" />
              On track
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productivity}>
                  <defs>
                    <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(245 80% 65%)" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="hsl(245 80% 65%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(d) =>
                      new Date(d).toLocaleDateString(undefined, { weekday: 'short' })
                    }
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="hsl(245 80% 65%)"
                    strokeWidth={2.5}
                    fill="url(#completedGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Task distribution</CardTitle>
            <CardDescription>Across all your projects</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <EmptyState icon={Activity} title="No data yet" description="Create some tasks to see them here." />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#888'} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity & upcoming */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>What's happened across the team</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <EmptyState icon={Activity} title="No activity yet" />
            ) : (
              <ul className="space-y-4">
                {recentActivity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 mt-0.5">
                      <AvatarImage src={a.user?.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-primary/15 text-primary text-[10px]">
                        {a.user ? getInitials(a.user.name) : '··'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">
                        <span className="font-medium">{a.user?.name ?? 'System'}</span>{' '}
                        <span className="text-muted-foreground">
                          {a.action.toLowerCase().replace('_', ' ')} {a.entity.toLowerCase()}
                        </span>{' '}
                        {a.task && <span className="font-medium">{a.task.title}</span>}
                        {a.project && (
                          <span className="text-muted-foreground"> in {a.project.name}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRelativeDate(a.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming deadlines</CardTitle>
              <CardDescription>Your tasks coming up soon</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tasks">
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcoming && upcoming.length > 0 ? (
              <ul className="space-y-3">
                {upcoming.slice(0, 6).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-accent/40 transition-colors"
                  >
                    <div
                      className="h-9 w-9 rounded-lg grid place-items-center text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${t.project?.color ?? '#6366f1'}22`,
                        color: t.project?.color ?? '#6366f1',
                      }}
                    >
                      {t.project?.name?.slice(0, 2) ?? '··'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.project?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-muted-foreground">
                        {t.dueDate &&
                          new Date(t.dueDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                      </p>
                      <Badge
                        variant="outline"
                        className={`mt-1 text-[10px] ${taskStatusMeta[t.status].color}`}
                      >
                        {taskStatusMeta[t.status].label}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={CheckCircle2} title="Nothing on deck" description="No upcoming deadlines." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
