# FixMyCampus – API Contract

## 1. Base API URL

- **Local Development:** `http://localhost:5000/api/v1`
- **Prefix:** `/api/v1`

---

## 2. Response & Status Conventions

### Success Response
```json
{
  "success": true,
  "message": "Human-readable status message",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

| Status Code | Meaning |
| --- | --- |
| `200` | Successful request |
| `201` | Resource created |
| `400` | Invalid input / validation error / invalid transition |
| `401` | Not authenticated |
| `403` | Insufficient permission / ownership violation |
| `404` | Resource not found |
| `409` | Duplicate / conflict |
| `500` | Internal server error |

---

## 3. Implemented Endpoints

### Health
| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Verify API server availability |

### Authentication
| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register a student account (forces `role: "student"`) |
| `POST` | `/auth/login` | Public | Authenticate user and set HTTP-only JWT cookie |
| `GET` | `/auth/me` | Authenticated | Return current authenticated user |
| `POST` | `/auth/logout` | Authenticated | Clear authentication cookie |

### Student Complaints
| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/complaints` | Student | Submit complaint (supports `multipart/form-data` `image`) |
| `GET` | `/complaints/my` | Student | List student's own complaints + summary counts |
| `GET` | `/complaints/:id` | Student (Owner) | Get complaint details and chronological `ComplaintHistory` |
| `POST` | `/complaints/:id/feedback` | Student (Owner) | Rate & close (`action: "close"`) or reopen (`action: "reopen"`) resolved complaint |

### Admin Management & Analytics
| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/admin/complaints` | Admin | List all complaints (paginated, filterable, searchable) |
| `GET` | `/admin/complaints/:id` | Admin | Get full complaint details and audit history |
| `PATCH` | `/admin/complaints/:id/review` | Admin | Approve or reject `pending`/`reopened` complaint |
| `PATCH` | `/admin/complaints/:id/assign` | Admin | Assign active maintenance staff member |
| `PATCH` | `/admin/complaints/:id/priority` | Admin | Update complaint priority |
| `GET` | `/admin/staff` | Admin | List maintenance staff accounts |
| `POST` | `/admin/staff` | Admin | Create maintenance staff account |
| `PATCH` | `/admin/staff/:id` | Admin | Update staff details or active status |
| `POST` | `/admin/users` | Admin | Provision `staff` or `admin` account |
| `GET` | `/admin/analytics` | Admin | Aggregated counts, resolution time, category/status/monthly trends, staff workload |

### Maintenance Staff
| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/staff/complaints` | Staff | List active tasks assigned to logged-in staff |
| `GET` | `/staff/complaints/:id` | Staff (Assigned) | Get assigned task details and history |
| `PATCH` | `/staff/complaints/:id/status` | Staff (Assigned) | Transition `assigned -> in_progress -> resolved` |
| `POST` | `/staff/complaints/:id/proof` | Staff (Assigned) | Upload resolution proof photograph (`multipart/form-data`) |
| `GET` | `/staff/history` | Staff | List completed (`resolved` / `closed`) tasks |

### Notifications
| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/notifications` | Authenticated | List user's notifications and `unreadCount` |
| `PATCH` | `/notifications/:id/read` | Authenticated (Recipient) | Mark notification as read |
| `PATCH` | `/notifications/read-all` | Authenticated | Mark all notifications as read |
