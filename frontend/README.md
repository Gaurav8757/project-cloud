# Project Cloud — Frontend

React + Vite + TypeScript + TailwindCSS + shadcn/ui.

## Install & run

```bash
cp .env.example .env
npm install
npm run dev
```

- App: <http://localhost:5173>
- Make sure the backend is running on <http://localhost:4000>

## Stack

| Layer        | Library                            |
| ------------ | ---------------------------------- |
| UI           | React 18 + Vite + TypeScript       |
| Styling      | TailwindCSS + tailwind-merge       |
| Components   | shadcn/ui (Radix primitives)       |
| Icons        | lucide-react + react-icons         |
| State        | Zustand (auth, UI)                 |
| Data         | TanStack Query v5                  |
| Forms        | React Hook Form + Zod              |
| Routing      | React Router v6                    |
| HTTP         | Axios (with refresh-token rotation)|
| Realtime     | Socket.IO client                   |
| Charts       | Recharts                           |
| Drag & Drop  | @hello-pangea/dnd                  |
| Toasts       | sonner                             |
| Dates        | date-fns                           |

## Project structure

```
src/
├── App.tsx
├── main.tsx
├── index.css                       # shadcn theme variables + utilities
├── components/
│   ├── ui/                         # shadcn/ui primitives
│   ├── common/                     # Logo, EmptyState
│   ├── layout/                     # AppShell, Sidebar, Topbar, NotificationBell, ThemeToggle
│   ├── auth/                       # AuthLayout
│   ├── dashboard/                  # StatCard
│   ├── projects/                   # ProjectCard, ProjectFormDialog
│   ├── tasks/                      # TaskDetailDialog, TaskCreateDialog
│   └── kanban/                     # KanbanBoard, KanbanCard
├── context/ThemeProvider.tsx
├── hooks/                          # useAuth, useSocket, useDebounced
├── lib/                            # api (axios), socket, utils
├── pages/
│   ├── auth/                       # Login, Register, Forgot, OTP, Reset
│   ├── dashboard/                  # Dashboard, Calendar
│   ├── projects/                   # ProjectsPage, ProjectDetailPage
│   ├── tasks/                      # TasksPage
│   ├── settings/                   # SettingsPage
│   ├── admin/                      # AdminPage
│   └── NotFoundPage.tsx
├── routes/                         # ProtectedRoute, PublicRoute, AdminRoute
├── services/                       # API calls (auth, project, task, ...)
├── store/                          # Zustand stores
├── types/                          # Shared types
└── utils/                          # meta (status/priority styling, dates)
```

## Features

- 🔐 **Auth flow** — login, register with password strength meter, forgot password with OTP, reset
- 🏠 **Dashboard** — stats, productivity chart, status breakdown, recent activity, upcoming tasks
- 📁 **Projects** — grid view with search & status filter, create/edit dialog with color picker
- 📋 **Kanban board** — drag-and-drop across 4 columns, optimistic UI, real-time updates
- ✅ **Tasks** — global table with filters, full task dialog (status, priority, assignee, due date, checklist, threaded comments, labels)
- 📅 **Calendar** — monthly view, tasks bucketed by due date, today highlighted
- 🔔 **Notifications** — live socket updates, mark-read, delete, unread counter
- ⚙️ **Settings** — profile, password change, notification preferences, theme (light/dark/system)
- 🛡️ **Admin** — users table with role management, active toggle, deletion
- 🎨 **Design** — dark-first, glass surfaces, gradient accents, Plus Jakarta Sans + Space Grotesk typography
- ♿ **Accessible** — Radix primitives, focus rings, keyboard navigation, semantic HTML
- 📱 **Responsive** — works from 360px to ultrawide

## Theming

Built on shadcn-style HSL CSS variables. Primary is indigo (`245 75% 60%`), with a sky-blue gradient
accent (`190 90% 55%`). Toggle theme via the Topbar or in Settings.
