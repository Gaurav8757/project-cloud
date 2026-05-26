import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Shield, Users as UsersIcon, FolderKanban, ListChecks, CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage, getInitials } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/primitives';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { StatCard } from '@/components/dashboard/StatCard';
import { userService, dashboardService } from '@/services';
import { useDebounced } from '@/hooks/useDebounced';
import { formatRelativeDate } from '@/utils/meta';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

const ROLE_IDS: Record<string, number> = { ADMIN: 1, MANAGER: 2, MEMBER: 3 };

export default function AdminPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 250);
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin', 'system'],
    queryFn: () => dashboardService.system(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', debouncedSearch],
    queryFn: () => userService.list({ search: debouncedSearch || undefined, limit: 50 }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { name?: string; roleId?: number; isActive?: boolean };
    }) => userService.adminUpdate(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User updated');
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update user';
      toast.error(msg);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => userService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User deleted');
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const roleOf = (u: User): string =>
    typeof u.role === 'string' ? u.role : u.role.name;

  const s = stats as
    | { users: number; projects: number; tasks: number; completed: number }
    | undefined;

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
            Administration
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight inline-flex items-center gap-2">
            Admin <Shield className="h-6 w-6 text-primary" />
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage users, roles, and system-wide settings.
          </p>
        </div>
      </div>

      {/* System stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={s?.users ?? '—'} icon={UsersIcon} tone="primary" />
        <StatCard label="Projects" value={s?.projects ?? '—'} icon={FolderKanban} tone="info" />
        <StatCard label="Tasks" value={s?.tasks ?? '—'} icon={ListChecks} tone="warning" />
        <StatCard
          label="Completed"
          value={s?.completed ?? '—'}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      {/* Users table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between flex">
          <div>
            <CardTitle>Team members</CardTitle>
            <CardDescription>
              {data?.meta?.total ?? 0} users in the workspace
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : data && data.items.length > 0 ? (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="border-y border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left font-medium px-6 py-3">User</th>
                    <th className="text-left font-medium px-3 py-3">Role</th>
                    <th className="text-left font-medium px-3 py-3">Joined</th>
                    <th className="text-left font-medium px-3 py-3">Active</th>
                    <th className="text-right font-medium px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((u) => {
                    const role = roleOf(u);
                    return (
                      <tr key={u.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={u.avatarUrl ?? undefined} />
                              <AvatarFallback className="text-[10px] bg-primary/15 text-primary">
                                {getInitials(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{u.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Select
                            value={role}
                            onValueChange={(v) =>
                              updateMutation.mutate({
                                id: u.id,
                                payload: { roleId: ROLE_IDS[v] },
                              })
                            }
                          >
                            <SelectTrigger className="h-8 w-32 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="MANAGER">Manager</SelectItem>
                              <SelectItem value="MEMBER">Member</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground text-xs">
                          {u.createdAt ? formatRelativeDate(u.createdAt) : '—'}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={u.isActive ?? true}
                              onCheckedChange={(v) =>
                                updateMutation.mutate({ id: u.id, payload: { isActive: !!v } })
                              }
                            />
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px]',
                                u.isActive ?? true
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-rose-500/15 text-rose-400',
                              )}
                            >
                              {u.isActive ?? true ? 'Active' : 'Disabled'}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (
                                confirm(
                                  `Delete user "${u.name}"? This cannot be undone and will remove all their data.`,
                                )
                              ) {
                                removeMutation.mutate(u.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={UsersIcon}
              title="No users found"
              description="Try adjusting your search."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
