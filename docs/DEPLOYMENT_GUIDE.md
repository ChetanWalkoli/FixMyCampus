# FixMyCampus – Production Deployment Guide

This guide covers deploying **FixMyCampus** using:
- **Database:** MongoDB Atlas
- **Image Storage:** Cloudinary
- **Backend API:** Render (Node.js + Express)
- **Frontend Client:** Vercel (React + Vite)

---

## 1. MongoDB Atlas Setup

1. Create a cluster on MongoDB Atlas and a database user with read/write access.
2. Under **Network Access**, allow connections from Render's outbound IPs (or `0.0.0.0/0` if using dynamic Render IPs).
3. Copy your connection string (`MONGODB_URI`). The backend connects to the `fixmycampus` database automatically via `dbName: "fixmycampus"`.

---

## 2. Cloudinary Setup

1. Sign in to Cloudinary and copy from **Dashboard**:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

---

## 3. Backend Deployment on Render

1. Create a new **Web Service** on Render connected to your GitHub repository.
2. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. Add **Environment Variables**:
   ```env
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=<your_mongodb_atlas_uri>
   FRONTEND_URL=https://<your-vercel-domain>.vercel.app
   JWT_SECRET=<64-char-random-secret>
   JWT_EXPIRES_IN=1d
   CLOUDINARY_CLOUD_NAME=<your_cloud_name>
   CLOUDINARY_API_KEY=<your_api_key>
   CLOUDINARY_API_SECRET=<your_api_secret>
   ```
4. Deploy and verify:
   ```text
   GET https://<your-render-service>.onrender.com/api/v1/health
   ```

---

## 4. Frontend Deployment on Vercel

1. Import your GitHub repository in Vercel.
2. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add **Environment Variable**:
   ```env
   VITE_API_URL=https://<your-render-service>.onrender.com/api/v1
   ```
4. [vercel.json](file:///c:/Users/Chetan/OneDrive/Desktop/FixMyCampus/frontend/vercel.json) is included so client-side routes (`/login`, `/student`, `/admin/analytics`, etc.) rewrite cleanly to `index.html`.
5. Update `FRONTEND_URL` on Render to match your exact Vercel production URL (`https://...vercel.app`, no trailing slash) so CORS and `SameSite=None; Secure` HTTP-only cookies work across domains.

---

## 5. Production Verification Checklist

- [ ] `GET https://<render-url>/api/v1/health` returns `200` with `environment: "production"`.
- [ ] Student registration sets `fmc_token` HTTP-only cookie (`Secure`, `SameSite=None`).
- [ ] Page refresh on `/student`, `/admin`, `/staff` preserves session via `GET /api/v1/auth/me`.
- [ ] Image upload succeeds and displays Cloudinary HTTPS URLs.
- [ ] Admin analytics renders real MongoDB aggregation counts.
