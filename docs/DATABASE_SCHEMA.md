# FixMyCampus – Planned Database Schema

> **Note (Phase 0):** No Mongoose models or collections are implemented in Phase 0. This document outlines the planned collections and their intended purposes for upcoming phases.

Database Name: `fixmycampus` (MongoDB Atlas)

---

## Planned Collections

### 1. `Users`
- **Purpose:** Stores all registered accounts across the three platform roles (`student`, `admin`, `staff`).
- **Key Fields:** Name, unique email, hashed password, role, department, `studentId`, `employeeId`, `isActive`, `tokenVersion` (for session invalidation on password reset/change), `passwordResetTokenHash`, `passwordResetExpiresAt`, and timestamps.

### 2. `Invitations`
- **Purpose:** Stores single-use, time-limited Staff and Admin account invitations before activation.
- **Key Fields:** `name`, `email`, `role` (`admin` | `staff`), `department`, `employeeId`, `tokenHash` (SHA-256, unique), `status` (`pending` | `accepted` | `revoked`), `invitedBy` (`User` ref), `expiresAt`, `acceptedAt`, and timestamps.

### 2. `Complaints`
- **Purpose:** Core collection storing campus maintenance complaints and their lifecycle state.
- **Intended Data:** Unique tracking ID (e.g., `FMC-1001`), title, description, category, campus location details, priority, workflow status (`pending`, `assigned`, `in_progress`, `resolved`, `closed`, `rejected`, `reopened`), submitted image references, resolution proof references, references to the submitting student (`User`) and assigned staff (`User`), resolution notes, and timestamps.
- **Introduced In:** Phase 2 (Student Complaint Submission) and extended in Phases 3–4.

### 3. `ComplaintHistory`
- **Purpose:** Immutable audit trail recording every significant action and status transition on a complaint.
- **Intended Data:** Reference to `Complaint`, reference to `User` who performed the action, action type, previous status, new status, optional note, and timestamp.
- **Introduced In:** Phase 2 and extended in Phases 3–4.

### 4. `Notifications`
- **Purpose:** Stores in-app notifications for users when key complaint events occur (submission, assignment, status update, resolution, reopening).
- **Intended Data:** Recipient `User` reference, related `Complaint` reference, title, message, notification type, read status, and timestamp.
- **Introduced In:** Phase 5 (Tracking, Notifications & Feedback).
