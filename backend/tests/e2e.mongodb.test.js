import { describe, it, expect, beforeAll, afterAll } from "vitest";
import dotenv from "dotenv";
import mongoose from "mongoose";
import request from "supertest";

dotenv.config();

process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "integration-test-jwt-secret-key";

const hasMongoUri = Boolean(
  process.env.MONGODB_URI && !process.env.MONGODB_URI.includes("username:password")
);

describe.skipIf(!hasMongoUri)(
  "Phase 7 – Real MongoDB End-to-End Integration",
  () => {
    let app;
    let User;
    const testDbName = `fixmycampus_test_${Date.now()}`;

    beforeAll(async () => {
      await mongoose.connect(process.env.MONGODB_URI, {
        dbName: testDbName,
        serverSelectionTimeoutMS: 8000,
      });

      const appMod = await import("../src/app.js");
      const userMod = await import("../src/models/User.js");
      app = appMod.default;
      User = userMod.default;
    }, 15000);

    afterAll(async () => {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
      }
    }, 15000);

    it("runs full complaint lifecycle across Student, Admin, Staff, Notifications, and Analytics", async () => {
      // 1. Register Student
      const studentAgent = request.agent(app);
      const regRes = await studentAgent.post("/api/v1/auth/register").send({
        name: "E2E Student",
        email: "e2e.student@college.edu",
        password: "StudentPassword123",
        department: "Computer",
        studentId: "E2E101",
      });
      expect(regRes.status).toBe(201);
      expect(regRes.body.data.user.role).toBe("student");

      // 2. Seed Admin & Login
      await User.create({
        name: "E2E Admin",
        email: "e2e.admin@college.edu",
        password: "AdminPassword123",
        role: "admin",
      });

      const adminAgent = request.agent(app);
      const adminLogin = await adminAgent.post("/api/v1/auth/login").send({
        email: "e2e.admin@college.edu",
        password: "AdminPassword123",
      });
      expect(adminLogin.status).toBe(200);

      // 3. Admin creates Staff
      const staffCreate = await adminAgent.post("/api/v1/admin/staff").send({
        name: "E2E Electrician",
        email: "e2e.staff@college.edu",
        password: "StaffPassword123",
        department: "Electrical",
      });
      expect(staffCreate.status).toBe(201);
      const staffId = staffCreate.body.data.staff._id;

      // 4. Student submits complaint
      const compRes = await studentAgent.post("/api/v1/complaints").send({
        title: "E2E Broken Projector",
        description: "Projector lamp flickers and shuts down after 5 minutes.",
        category: "equipment",
        priority: "high",
        location: { block: "IT Block", floor: "3rd", room: "302" },
      });
      expect(compRes.status).toBe(201);
      const complaintId = compRes.body.data.complaint._id;
      expect(compRes.body.data.complaint.complaintId).toMatch(/^FMC-\d+$/);

      // 5. Admin assigns Staff
      const assignRes = await adminAgent
        .patch(`/api/v1/admin/complaints/${complaintId}/assign`)
        .send({ staffId });
      expect(assignRes.status).toBe(200);
      expect(assignRes.body.data.complaint.status).toBe("assigned");

      // 6. Staff logs in, starts work, and resolves complaint
      const staffAgent = request.agent(app);
      const staffLogin = await staffAgent.post("/api/v1/auth/login").send({
        email: "e2e.staff@college.edu",
        password: "StaffPassword123",
      });
      expect(staffLogin.status).toBe(200);

      const startRes = await staffAgent
        .patch(`/api/v1/staff/complaints/${complaintId}/status`)
        .send({ status: "in_progress", note: "Checking power supply" });
      expect(startRes.status).toBe(200);

      const resolveRes = await staffAgent
        .patch(`/api/v1/staff/complaints/${complaintId}/status`)
        .send({
          status: "resolved",
          resolutionNote: "Replaced projector lamp module.",
        });
      expect(resolveRes.status).toBe(200);

      // 7. Admin checks real MongoDB aggregation analytics
      const analyticsRes = await adminAgent.get("/api/v1/admin/analytics");
      expect(analyticsRes.status).toBe(200);
      expect(analyticsRes.body.data.total).toBe(1);
      expect(analyticsRes.body.data.resolved).toBe(1);
      expect(analyticsRes.body.data.categoryBreakdown).toEqual([
        { category: "equipment", count: 1 },
      ]);
      expect(analyticsRes.body.data.staffWorkload).toHaveLength(1);

      // 8. Student checks notifications and submits 5-star feedback to close
      const notifRes = await studentAgent.get("/api/v1/notifications");
      expect(notifRes.status).toBe(200);
      expect(notifRes.body.data.notifications.length).toBeGreaterThanOrEqual(3);

      const feedbackRes = await studentAgent
        .post(`/api/v1/complaints/${complaintId}/feedback`)
        .send({ action: "close", rating: 5, comment: "Works great now!" });
      expect(feedbackRes.status).toBe(200);
      expect(feedbackRes.body.data.complaint.status).toBe("closed");
    }, 20000);
  }
);
