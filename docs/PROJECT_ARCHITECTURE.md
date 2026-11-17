# FixMyCampus – Project Architecture

## 1. Project Overview

**FixMyCampus** is a centralized Campus Maintenance and Complaint Management Platform built on the MERN stack. It enables students to report campus infrastructure issues, administrators to review and assign complaints, and maintenance staff to update work progress and upload resolution proof.

The system supports three roles:
- **Student**: Submits complaints, tracks progress, receives notifications, and submits feedback.
- **Admin**: Reviews, approves/rejects, prioritizes, and assigns complaints; manages staff and views analytics.
- **Maintenance Staff**: Views assigned tasks, updates work status, and uploads resolution proof.

---

## 2. Technology Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React.js, Vite, JavaScript (ES Modules), React Router DOM, Axios, Tailwind CSS, Lucide React, Recharts, Context API |
| **Backend** | Node.js, Express.js, JavaScript (ES Modules), Helmet, CORS, Cookie Parser, Morgan, Express Rate Limit |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Tooling** | Git, npm, Nodemon, ESLint, Prettier |

---

## 3. Frontend Architecture

The frontend is an independent Vite + React application (`frontend/`):

- `src/pages/` — Route-level page components organized by role (`public/`, and future `student/`, `admin/`, `staff/`).
- `src/components/` — Reusable UI (`ui/`), layout (`layout/`), and shared (`common/`) components.
- `src/routes/` — Centralized routing configuration (`AppRouter.jsx`).
- `src/context/` — React Context providers (`AuthContext.jsx`).
- `src/services/` — Axios instance (`api.js`) and domain-specific API modules.
- `src/hooks/`, `src/utils/`, `src/constants/`, `src/styles/` — Custom hooks, helpers, constants, and global CSS.

---

## 4. Backend Architecture

The backend is an independent Node.js + Express application (`backend/`):

- `src/server.js` — Entry point: loads environment variables, connects to MongoDB Atlas, starts the HTTP server only after DB connection succeeds, and handles graceful shutdown.
- `src/app.js` — Express app configuration: security headers (`helmet`), credentials-enabled CORS, JSON/cookie parsing, request logging (`morgan`), API route mounting, 404 handler, and global error handler.
- `src/config/` — Environment and database connection configuration (`db.js`, `env.js`).
- `src/routes/` — Express route definitions mounted under `/api/v1`.
- `src/controllers/`, `src/services/`, `src/middleware/`, `src/models/`, `src/validators/`, `src/utils/`, `src/constants/` — Modular layers for business logic, validation, and data access.

---

## 5. Database Architecture

- Hosted on **MongoDB Atlas** using the `fixmycampus` database.
- Accessed via **Mongoose ODM**.
- Connection is established at startup before the Express server begins listening.
- Models and schemas will be introduced incrementally starting in Phase 1.

---

## 6. Request–Response Flow

```text
React Frontend (http://localhost:5173)
  │
  │  Axios (withCredentials: true, JSON)
  ▼
Express Server (http://localhost:5000/api/v1)
  │
  ├─► Security & Parsing Middleware (helmet, cors, cookie-parser, express.json, morgan)
  ├─► Route Handlers (/api/v1/...)
  ├─► Controllers & Services
  ├─► Mongoose ODM ──► MongoDB Atlas (fixmycampus)
  └─► Global Error Handler / Standardized JSON Response
```

---

## 7. Development Environment

- **Frontend Dev Server**: `http://localhost:5173` (`npm run dev` inside `frontend/`)
- **Backend API Server**: `http://localhost:5000` (`npm run dev` inside `backend/`)
- **Health Check Endpoint**: `GET http://localhost:5000/api/v1/health`
