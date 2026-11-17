# FixMyCampus

**Campus Maintenance & Complaint Management Platform**

FixMyCampus is a centralized MERN-stack platform for reporting, assigning, tracking, and resolving infrastructure-related problems in educational institutions across three roles: **Student**, **Admin**, and **Maintenance Staff**.

---

## Key Features

- **Authentication & RBAC:** HTTP-only JWT cookie authentication (`bcrypt` password hashing, `student`, `admin`, and `staff` roles, protected routes).
- **Student Portal:** Submit complaints with optional photo evidence (Cloudinary), unique `FMC-XXXX` tracking IDs, searchable complaint list, status timeline, in-app notifications, and 1–5 star resolution feedback / reopen flow.
- **Admin Portal:** Filterable & paginated complaint table, approve/reject with reason, priority updates, active staff assignment, staff directory management, and Recharts analytics dashboard.
- **Maintenance Staff Portal:** Assigned task queue, strict status transitions (`assigned → in_progress → resolved`), maintenance notes, resolution proof photo uploads, and completed work history.

---

## Project Structure

```text
FixMyCampus/
├── frontend/       # React + Vite + Tailwind CSS + Recharts client
├── backend/        # Node.js + Express + Mongoose + Zod API server
├── docs/           # Architecture, schema, API contract, roadmap, deployment guide
├── .gitignore
└── README.md
```

---

## Local Setup

### 1. Environment Variables
- Copy `backend/.env.example` → `backend/.env` and configure `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, and `CLOUDINARY_*`.
- Copy `frontend/.env.example` → `frontend/.env` (`VITE_API_URL=http://localhost:5000/api/v1`).

### 2. Run in Two PowerShell Terminals

**Terminal 1 – Backend (`http://localhost:5000`):**
```powershell
cd backend
npm install
npm run dev
```

**Terminal 2 – Frontend (`http://localhost:5173`):**
```powershell
cd frontend
npm install
npm run dev
```

---

## Testing & Quality Checks

### Backend (Unit/API + Real MongoDB E2E Integration)
```powershell
cd backend
npm test
npm run lint
```

### Frontend (Component/Route Tests + Lint + Build)
```powershell
cd frontend
npm test
npm run lint
npm run build
```

---

## Documentation

- [Project Architecture](docs/PROJECT_ARCHITECTURE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [API Contract](docs/API_CONTRACT.md)
- [Development Roadmap](docs/DEVELOPMENT_ROADMAP.md)
- [Deployment Guide (Render + Vercel + Atlas)](docs/DEPLOYMENT_GUIDE.md)
