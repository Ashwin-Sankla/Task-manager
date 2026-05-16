# TaskFlow — Enterprise Task Manager

A professional, full-stack task management SaaS platform with global role-based access control (Super Admin/User), project-level permissions (Admin/Member), and a responsive dark theme. Built with React, Node/Express, Prisma, and PostgreSQL.

---

## 🌟 Key Features

- **Professional Dark Theme** — A sleek, high-contrast, modern UI built with Tailwind CSS, fully responsive across mobile, tablet, and desktop.
- **Admin Dashboard** — A secure `SUPER_ADMIN` hub featuring real-time workload distribution pie charts and a complete team member overview (Active, Inactive, On Leave).
- **Authentication & Security** — JWT-based signup/login with automatic logout on expiry and strict API route protection based on system and project roles.
- **Project Management** — Create, list, delete, and manage projects. Project owners can invite members via email.
- **Task Tracking** — Track tasks by status (TODO, IN_PROGRESS, DONE) and priority (LOW, MEDIUM, HIGH) with due date support.
- **Performance Analytics** — Personalized dashboards showing total projects, open tasks, overdue tasks, and more.

---

## 🛠️ Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React 18 + Vite | Fast HMR, modern build tooling |
| Styling | Tailwind CSS | Utility-first, standardized design system |
| Data fetching | TanStack Query v5 | Caching, query invalidation, optimal loading states |
| Charting | Recharts | Composable and responsive charts for the Admin Dashboard |
| Backend | Node.js + Express | Minimal, scalable, and easy to deploy |
| ORM | Prisma | Type-safe database queries and migrations (Binary engine) |
| Database | PostgreSQL | Relational integrity (Hosted on Neon) |
| Auth | JWT & bcryptjs | Stateless, secure password hashing |

---

## 🚀 Local Development

### Prerequisites
- Node.js ≥ 18
- PostgreSQL running locally or remotely (e.g., Neon, Supabase, Railway)

### 1. Clone and Install

```bash
git clone https://github.com/yourname/taskmanager
cd taskmanager

# Backend Setup
cd backend
npm install
cp .env.example .env  # Configure your DATABASE_URL and JWT_SECRET

# Frontend Setup
cd ../frontend
npm install
cp .env.example .env.local # Configure VITE_API_URL if needed
```

### 2. Database Setup & Seeding

The provided seed script wipes the existing database clean and generates mock data including a `SUPER_ADMIN`, a normal `USER`, inactive users, and several mock tasks to showcase the dashboard metrics.

```bash
cd backend
npx prisma db push        # Synchronize your schema
npx prisma generate       # Generate Prisma client
npm run db:seed           # Populate the database with mock data
```

### 3. Run the Development Servers

```bash
# Terminal 1 — API Server
cd backend
npm run dev

# Terminal 2 — Frontend Application
cd frontend
npm run dev
```

- **Frontend:** http://localhost:5173  
- **API:** http://localhost:4000  

### 🔐 Demo Credentials
- **Admin Hub Access:** `admin@demo.com` / `password123` (System `SUPER_ADMIN`, display name overridden to "Ashwin")
- **Standard User:** `member@demo.com` / `password123` (System `USER`, cannot access Admin routes)

---

## 🔌 API Reference

### Auth
| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| POST | `/api/auth/register` | — | `{name, email, password}` | Returns token + user |
| POST | `/api/auth/login` | — | `{email, password}` | Returns token + user |
| GET | `/api/auth/me` | Bearer | — | Returns current user profile |

### Global Administration (`SUPER_ADMIN` only)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/admin/workload` | Bearer | Global task statistics for the Pie Chart |
| GET | `/api/admin/members` | Bearer | Paginated team member details and KPI stats |

### Projects
| Method | Path | Role | Notes |
|--------|------|------|-------|
| GET | `/api/projects` | Any Member | Lists user's involved projects |
| POST | `/api/projects` | Authenticated | Creates a project (Caller becomes Project `ADMIN`) |
| GET | `/api/projects/:id` | Member | Project details + team members |
| PATCH | `/api/projects/:id` | Admin | Edit project name/description |
| DELETE | `/api/projects/:id` | Admin | Cascades to tasks/members |
| POST | `/api/projects/:id/members`| Admin | `{email, role}` |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Cannot remove the owner |

### Tasks
| Method | Path | Role | Notes |
|--------|------|------|-------|
| GET | `/api/projects/:id/tasks` | Member | Supports `?status=&priority=&assigneeId=` filtering |
| POST | `/api/projects/:id/tasks` | Member | Creates a new task |
| PATCH | `/api/projects/:id/tasks/:taskId` | Member | Updates any task field |
| DELETE | `/api/projects/:id/tasks/:taskId` | Admin or Creator | Deletes a task |

### Dashboard
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/dashboard` | Authenticated | Personalized task metrics for the user |

---

## 📁 Project Structure

```text
taskmanager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   ← Data models (User, Project, Task, Enums)
│   │   └── seed.js         ← Mock data initialization script
│   ├── src/
│   │   ├── lib/prisma.js   ← Singleton database client
│   │   ├── middleware/
│   │   │   └── auth.js     ← JWT verification + System/Project RBAC guards
│   │   ├── routes/
│   │   │   ├── admin.js    ← Super Admin statistics and member listings
│   │   │   ├── auth.js     ← Registration and Login
│   │   │   ├── projects.js ← Project CRUD and membership
│   │   │   ├── tasks.js    ← Task CRUD
│   │   │   └── dashboard.js← Personal metrics
│   │   └── index.js        ← Express app entry
│   └── package.json
└── frontend/
    ├── src/
    │   ├── lib/api.js          ← Axios instance with auth interceptors
    │   ├── context/
    │   │   └── AuthContext.jsx ← Global auth state and Admin metadata overrides
    │   ├── components/
    │   │   ├── Layout.jsx      ← Responsive Sidebar and Mobile Header
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── AdminRoute.jsx  ← Route guard for SUPER_ADMIN access
    │   │   └── WorkloadChart.jsx ← Recharts doughnut implementation
    │   ├── pages/
    │   │   ├── AdminDashboard.jsx ← Platform-wide KPIs and charts
    │   │   ├── AdminMembers.jsx   ← Detailed team member table and filters
    │   │   ├── Dashboard.jsx      ← Personal project metrics
    │   │   ├── ProjectDetail.jsx  
    │   │   ├── Projects.jsx       
    │   │   ├── Login.jsx          
    │   │   └── Register.jsx       
    │   ├── App.jsx             ← React Router configuration
    │   └── index.css           ← Global styles, Tailwind directives, dark theme tokens
    ├── tailwind.config.js      ← Custom color palette (Slate & Indigo)
    └── package.json
```
