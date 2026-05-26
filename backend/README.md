# Project Cloud — Backend

Express + TypeScript + Prisma + SQLite API.

## Install & run

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

- API: <http://localhost:4000/api/v1>
- Docs: <http://localhost:4000/api/docs>
- Health: <http://localhost:4000/api/v1/health>

## Architecture

```
src/
├── app.ts                 # Express app bootstrap
├── server.ts              # HTTP + Socket.IO + graceful shutdown
├── config/                # env, prisma, logger, swagger
├── constants/             # roles, statuses, socket events
├── controllers/           # thin HTTP controllers
├── services/              # business logic
├── repositories/          # Prisma data-access layer
├── routes/                # Express routers
├── middlewares/           # auth, RBAC, validation, sanitization, error, rate-limit
├── validations/           # Zod schemas
├── sockets/               # Socket.IO setup with JWT handshake
├── utils/                 # AppError, apiResponse, crypto, pagination
├── database/seed.ts       # Demo data
├── types/                 # Express type augmentation
└── logs/                  # Daily-rotated log files
```

Layers:

- **Controller** → validates I/O, calls service, formats response
- **Service** → business logic, calls repositories, emits events
- **Repository** → wraps Prisma queries

## Auth flow

1. `POST /auth/register` → create user
2. `POST /auth/login` → returns `{ accessToken, refreshToken, user }`
3. `POST /auth/refresh` with refresh token → rotates and returns new pair
4. `POST /auth/logout` revokes the refresh token

Access tokens expire in 15 min by default, refresh tokens in 7 days. Refresh
tokens are stored in `refresh_tokens` and revoked on rotation/logout. Reset
password flow uses OTP (printed to console in dev).

## RBAC

`ADMIN`, `MANAGER`, `MEMBER` global roles, plus per-project member roles
(`OWNER`, `MANAGER`, `MEMBER`, `VIEWER`). Middleware `requireRoles(...)`
gates admin endpoints.

## Real-time

- Socket.IO authenticated with the same JWT
- Personal room `user:<id>` for notifications
- Project room `project:<id>` for kanban updates, comments
- Server emits: `notification:new`, `task:created|updated|moved|deleted`, `comment:new`

## API surface (v1)

| Method | Path                                    | Description                      |
| ------ | --------------------------------------- | -------------------------------- |
| POST   | `/auth/register`                        | Create account                   |
| POST   | `/auth/login`                           | Login                            |
| POST   | `/auth/refresh`                         | Rotate tokens                    |
| POST   | `/auth/logout`                          | Revoke refresh token             |
| POST   | `/auth/forgot-password`                 | Request OTP                      |
| POST   | `/auth/verify-otp`                      | Verify OTP                       |
| POST   | `/auth/reset-password`                  | Reset password using OTP         |
| GET    | `/users/me`                             | Current user profile             |
| PATCH  | `/users/me`                             | Update profile                   |
| POST   | `/users/change-password`                | Change password                  |
| PATCH  | `/users/notification-preferences`       | Update prefs                     |
| GET    | `/users` (admin)                        | List users                       |
| PATCH  | `/users/:id` (admin)                    | Update user                      |
| DELETE | `/users/:id` (admin)                    | Delete user                      |
| GET    | `/projects`                             | List projects                    |
| POST   | `/projects`                             | Create project                   |
| GET    | `/projects/:id`                         | Get project                      |
| PATCH  | `/projects/:id`                         | Update project                   |
| DELETE | `/projects/:id`                         | Delete project                   |
| GET    | `/projects/:id/analytics`               | Project analytics                |
| POST   | `/projects/:id/members`                 | Add member                       |
| DELETE | `/projects/:id/members/:userId`         | Remove member                    |
| GET    | `/tasks`                                | List tasks (filters/pagination)  |
| POST   | `/tasks`                                | Create task                      |
| GET    | `/tasks/board/:projectId`               | Kanban grouped by status         |
| GET    | `/tasks/:id`                            | Get task                         |
| PATCH  | `/tasks/:id`                            | Update task                      |
| PATCH  | `/tasks/:id/move`                       | Move (kanban)                    |
| DELETE | `/tasks/:id`                            | Delete task                      |
| POST   | `/tasks/:id/comments`                   | Add comment                      |
| DELETE | `/tasks/:id/comments/:commentId`        | Delete comment                   |
| POST   | `/tasks/:id/checklist`                  | Add checklist item               |
| PATCH  | `/tasks/:id/checklist/:itemId`          | Toggle checklist item            |
| DELETE | `/tasks/:id/checklist/:itemId`          | Delete checklist item            |
| GET    | `/notifications`                        | List notifications               |
| PATCH  | `/notifications/read-all`               | Mark all read                    |
| PATCH  | `/notifications/:id/read`               | Mark one read                    |
| DELETE | `/notifications/:id`                    | Delete                           |
| GET    | `/dashboard/overview`                   | Aggregated dashboard data        |
| GET    | `/dashboard/upcoming`                   | Upcoming tasks                   |
| GET    | `/dashboard/system` (admin)             | System counts                    |

## Demo accounts

| Email                     | Password    | Role    |
| ------------------------- | ----------- | ------- |
| admin@projectcloud.io     | Admin@123   | ADMIN   |
| manager@projectcloud.io   | Manager@123 | MANAGER |
| user@projectcloud.io      | User@123    | MEMBER  |
