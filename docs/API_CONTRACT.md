# FixMyCampus – API Contract

## 1. Base API URL

- **Local Development:** `http://localhost:5000/api/v1`
- **Prefix:** `/api/v1`

---

## 2. Health Endpoint (Phase 0)

### `GET /api/v1/health`

Verifies that the Express API server is running. Does not expose database credentials or sensitive configuration.

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "FixMyCampus API is running",
  "environment": "development"
}
```

---

## 3. JSON Response Convention

All API endpoints must return a consistent JSON structure.

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

---

## 4. HTTP Status Code Conventions

| Status Code | Meaning |
| --- | --- |
| `200` | Successful request |
| `201` | Resource created |
| `400` | Invalid input / validation error |
| `401` | Not authenticated |
| `403` | Insufficient permission / forbidden |
| `404` | Resource not found |
| `409` | Duplicate / conflict (e.g., email already exists) |
| `500` | Internal server error |

---

## 5. Planned Authentication Strategy (Phase 1+)

- Authentication will use **JSON Web Tokens (JWT)** stored in **HTTP-only, Secure (in production), SameSite cookies**.
- Tokens will **not** be stored in `localStorage`.
- Frontend Axios requests use `withCredentials: true` and CORS is configured with an explicit origin (`FRONTEND_URL`) and `credentials: true`.
- Role-based authorization middleware on the backend will enforce permissions for `student`, `admin`, and `staff`.
