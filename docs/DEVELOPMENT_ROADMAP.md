# FixMyCampus – Development Roadmap

FixMyCampus is built in independent, testable phases so frontend, backend, and database responsibilities stay cleanly separated.

| Phase | Name | Scope |
| --- | --- | --- |
| **Phase 0** | **Project Setup** | Initialize independent React (Vite) frontend and Node/Express backend, configure MongoDB Atlas connection, environment examples, linting/formatting, health API, and documentation. |
| **Phase 1** | **Authentication & Role-Based Access** | Implement `User` schema, bcrypt password hashing, HTTP-only JWT cookies, registration/login/logout/me APIs, auth middleware, role guards, login/register pages, and protected routes. |
| **Phase 2** | **Student Dashboard & Complaint Submission** | Implement `Complaint` & `ComplaintHistory` schemas, unique complaint IDs, Cloudinary/Multer image uploads, student complaint creation/listing/detail APIs, and student UI. |
| **Phase 3** | **Admin Dashboard & Complaint Management** | Implement admin APIs for viewing/filtering/paginating complaints, approve/reject, priority updates, staff management, staff assignment, and admin UI. |
| **Phase 4** | **Maintenance Staff Dashboard** | Implement staff APIs for assigned tasks, ownership checks, status transition validation, resolution proof upload, work history, and staff UI. |
| **Phase 5** | **Complaint Tracking, Notifications & Feedback** | Implement `Notification` schema, event-driven notifications, mark-as-read APIs, complaint timeline, and student resolution feedback/rating. |
| **Phase 6** | **Analytics & Reporting** | Implement MongoDB aggregation pipelines for complaint counts, category breakdown, status distribution, average resolution time, staff workload, and Recharts visualizations. |
| **Phase 7** | **Testing, Security & Deployment** | End-to-end testing, security hardening (rate limiting, validation, CSRF), deployment to Vercel (frontend) & Render (backend), and final documentation. |
