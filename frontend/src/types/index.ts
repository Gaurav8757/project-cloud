import '../env';

export type Role = 'ADMIN' | 'MANAGER' | 'MEMBER';
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  isVerified?: boolean;
  role: { id: number; name: Role } | string;
  createdAt?: string;
  isActive?: boolean;
  notificationPrefs?: NotificationPrefs | null;
}

export interface NotificationPrefs {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  taskAssigned: boolean;
  taskCommented: boolean;
  projectUpdates: boolean;
  deadlineReminders: boolean;
}

export interface ProjectMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'MANAGER' | 'MEMBER' | 'VIEWER';
  user: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  color?: string | null;
  startDate?: string | null;
  deadline?: string | null;
  ownerId: string;
  owner: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  members: ProjectMember[];
  _count: { tasks: number };
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  position: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  position: number;
  dueDate?: string | null;
  completedAt?: string | null;
  labels: string[];
  parentId?: string | null;
  projectId: string;
  assigneeId?: string | null;
  assignee?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'> | null;
  createdBy: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  checklist?: ChecklistItem[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  subtasks?: Task[];
  project?: Pick<Project, 'id' | 'name' | 'color'>;
  _count?: { comments: number; attachments: number; subtasks: number };
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  body: string;
  authorId: string;
  taskId: string;
  createdAt: string;
  author: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
}

export interface TaskAttachment {
  id: string;
  filename: string;
  url: string;
  size?: number;
  mimeType?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  metadata?: string | null;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  metadata?: string | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'avatarUrl'> | null;
  project?: Pick<Project, 'id' | 'name' | 'color'> | null;
  task?: Pick<Task, 'id' | 'title'> | null;
}

export interface DashboardOverview {
  totals: {
    totalProjects: number;
    activeProjects: number;
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    overdueTasks: number;
  };
  statusBreakdown: { status: string; _count: { _all: number } }[];
  productivity: { date: string; completed: number }[];
  recentActivity: ActivityLog[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page?: number; pageSize?: number; total?: number; totalPages?: number; unread?: number };
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
