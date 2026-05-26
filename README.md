# Project Cloud

A production-grade **task & project management SaaS platform** — full-stack, real-time, dark-mode-first.

```
project-cloud/
├── backend/          # Express + TypeScript + Prisma + SQLite
└── frontend/         # React + Vite + TypeScript + Tailwind + shadcn/ui
```

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Backend runs on <http://localhost:4000>.
Swagger docs at <http://localhost:4000/api/docs>.

### 2. Frontend

In a new terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App opens at <http://localhost:5173>.

## Demo accounts

| Email                     | Password    | Role    |
| ------------------------- | ----------- | ------- |
| admin@projectcloud.io     | Admin@123   | ADMIN   |
| manager@projectcloud.io   | Manager@123 | MANAGER |
| user@projectcloud.io      | User@123    | MEMBER  |

## Features

- 🔐 **Auth** — JWT access + refresh rotation, OTP password reset, RBAC
- 🏠 **Dashboard** — analytics, productivity chart, task distribution, recent activity, upcoming deadlines
- 📁 **Projects** — CRUD, members, deadlines, color tags, status & priority
- 📋 **Kanban** — drag-and-drop across 4 columns with real-time updates
- ✅ **Tasks** — subtasks, checklists, comments, labels, assignees, attachments
- 📅 **Calendar** — monthly view with task deadlines
- 🔔 **Notifications** — live (Socket.IO), mark-read, delete
- ⚙️ **Settings** — profile, password, notification prefs, light/dark/system theme
- 🛡️ **Admin** — users table, role management, deactivate/delete
- 📱 **Responsive** — works on phones, tablets, and ultrawide monitors
- ♿ **Accessible** — Radix primitives, focus rings, semantic HTML

See `backend/README.md` and `frontend/README.md` for full details.

## Stack

**Backend:** Node.js + Express + TypeScript + Prisma + SQLite + JWT + Zod + Winston + Swagger + Socket.IO
**Frontend:** React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui + TanStack Query + Zustand + React Hook Form + Zod + Axios + Recharts + @hello-pangea/dnd
