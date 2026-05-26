import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Sun, Moon, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger, Switch } from '@/components/ui/primitives';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage, getInitials } from '@/components/ui/avatar';
import { userService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/context/ThemeProvider';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().min(2).max(80),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().or(z.literal('')).optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
});
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const me = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  const { theme, setTheme } = useTheme();

  const { data: profile } = useQuery({ queryKey: ['me'], queryFn: () => userService.me() });

  // Profile form
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', bio: '', avatarUrl: '' },
  });
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name,
        bio: profile.bio ?? '',
        avatarUrl: profile.avatarUrl ?? '',
      });
    }
  }, [profile, profileForm]);

  const profileMutation = useMutation({
    mutationFn: (d: ProfileForm) =>
      userService.updateProfile({
        name: d.name,
        bio: d.bio || undefined,
        avatarUrl: d.avatarUrl || undefined,
      }),
    onSuccess: (u) => {
      if (me) setUser({ ...me, ...u });
      qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile updated');
    },
  });

  // Password form
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });
  const passwordMutation = useMutation({
    mutationFn: (d: PasswordForm) => userService.changePassword(d.currentPassword, d.newPassword),
    onSuccess: () => {
      toast.success('Password updated');
      passwordForm.reset();
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update password';
      toast.error(msg);
    },
  });

  // Notification prefs
  const prefsMutation = useMutation({
    mutationFn: (prefs: Record<string, boolean>) => userService.updateNotificationPrefs(prefs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Preferences saved');
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
          Account
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account, security, and preferences.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your public profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))}
                className="space-y-5"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profileForm.watch('avatarUrl') || profile?.avatarUrl || undefined} />
                    <AvatarFallback className="text-lg bg-primary/15 text-primary">
                      {profile ? getInitials(profile.name) : '··'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                    <Input
                      id="avatarUrl"
                      placeholder="https://…"
                      {...profileForm.register('avatarUrl')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Display name</Label>
                  <Input id="name" {...profileForm.register('name')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" rows={3} {...profileForm.register('bio')} />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="gradient" disabled={profileMutation.isPending}>
                    {profileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>Use a strong, unique password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...passwordForm.register('currentPassword')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-xs text-destructive">
                      Must be 8+ chars with upper, lower, and a number.
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="gradient" disabled={passwordMutation.isPending}>
                    {passwordMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Update password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification preferences</CardTitle>
              <CardDescription>Control which notifications you receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'emailEnabled', label: 'Email notifications', desc: 'Receive emails for major events' },
                { key: 'inAppEnabled', label: 'In-app notifications', desc: 'Show notifications in the bell menu' },
                { key: 'taskAssigned', label: 'Task assigned to me', desc: 'When a task is assigned to you' },
                { key: 'taskCommented', label: 'New comments on my tasks', desc: 'When someone comments on your tasks' },
                { key: 'projectUpdates', label: 'Project updates', desc: 'Status & member changes' },
                { key: 'deadlineReminders', label: 'Deadline reminders', desc: 'Upcoming task deadlines' },
              ].map((p) => {
                const value = (profile?.notificationPrefs as Record<string, boolean> | undefined)?.[p.key] ?? true;
                return (
                  <div
                    key={p.key}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(v) => prefsMutation.mutate({ [p.key]: !!v })}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Pick the theme that fits your eyes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', label: 'Light', Icon: Sun },
                  { id: 'dark', label: 'Dark', Icon: Moon },
                  { id: 'system', label: 'System', Icon: Monitor },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTheme(id as 'light' | 'dark' | 'system')}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all hover:bg-accent',
                      theme === id ? 'border-primary bg-primary/5' : 'border-border',
                    )}
                  >
                    <Icon className="h-5 w-5 mb-2 text-primary" />
                    <p className="font-medium text-sm">{label}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
