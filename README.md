# FixMyCampus

**Campus Maintenance & Complaint Management Platform**

FixMyCampus is a centralized MERN-stack platform for reporting, assigning, tracking, and resolving infrastructure-related problems in educational institutions across three roles: **Student**, **Admin**, and **Maintenance Staff**.

---

## Project Structure

```text
FixMyCampus/
├── frontend/       # React + Vite + Tailwind CSS client
├── backend/        # Node.js + Express + Mongoose API server
├── docs/           # Architecture, schema, API contract, and roadmap docs
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js** (v18+ recommended) & **npm**
- **MongoDB Atlas** cluster (database: `fixmycampus`)

---

## Environment Setup

1. **Backend environment:**
   Copy `backend/.env.example` to `backend/.env` and fill in your `MONGODB_URI` and secrets.
2. **Frontend environment:**
   Copy `frontend/.env.example` to `frontend/.env` (defaults to `http://localhost:5000/api/v1`).

---

## Running Locally (Two PowerShell Terminals)

### Terminal 1 – Backend (`http://localhost:5000`)
```powershell
cd backend
npm install
npm run dev
```

### Terminal 2 – Frontend (`http://localhost:5173`)
```powershell
cd frontend
npm install
npm run dev
```

### Health Check
Verify the API is running:
```text
GET http://localhost:5000/api/v1/health
```

---

## Documentation

- [Project Architecture](docs/PROJECT_ARCHITECTURE.md)
- [Database Schema Plan](docs/DATABASE_SCHEMA.md)
- [API Contract](docs/API_CONTRACT.md)
- [Development Roadmap](docs/DEVELOPMENT_ROADMAP.md)
