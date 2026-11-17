import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-vitest-only";
process.env.JWT_EXPIRES_IN = "1d";

const usersStore = [];
const complaintsStore = [];
const historyStore = [];
const notificationsStore = [];
let objIdCounter = 1;

const nextObjectId = () => String(objIdCounter++).padStart(24, "0");

const makeUserDoc = (data) => ({
  _id: nextObjectId(),
  name: data.name,
  email: data.email.toLowerCase(),
  password: data.password,
  role: data.role || "student",
  isActive: true,
  createdAt: new Date(),
  async comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  },
});

vi.mock("../src/models/User.js", () => ({
  default: {
    findOne: vi.fn((query) => {
      const found =
        usersStore.find((u) => u.email === query.email) || null;
      return {
        select: vi.fn(async () => found),
        then: (resolve, reject) => Promise.resolve(found).then(resolve, reject),
      };
    }),
    findById: vi.fn(async (id) => {
      return usersStore.find((u) => u._id === String(id)) || null;
    }),
  },
}));

vi.mock("../src/models/Complaint.js", () => ({
  default: {
    findOne: vi.fn((query) => {
      const found =
        complaintsStore.find((c) =>
          query._id
            ? String(c._id) === String(query._id)
            : c.complaintId === query.complaintId
        ) || null;
      return Promise.resolve(found);
    }),
  },
}));

vi.mock("../src/models/ComplaintHistory.js", () => ({
  default: {
    create: vi.fn(async (data) => {
      const doc = { _id: nextObjectId(), ...data, createdAt: new Date() };
      historyStore.push(doc);
      return doc;
    }),
  },
}));

vi.mock("../src/models/Notification.js", () => ({
  default: {
    create: vi.fn(async (data) => {
      const doc = {
        _id: nextObjectId(),
        ...data,
        isRead: false,
        createdAt: new Date(),
        async save() {
          return this;
        },
      };
      notificationsStore.push(doc);
      return doc;
    }),
    find: vi.fn((filter) => {
      const matched = notificationsStore.filter(
        (n) => String(n.recipient) === String(filter.recipient)
      );
      const chain = {
        sort: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        populate: vi.fn(async () => matched),
      };
      return chain;
    }),
    findById: vi.fn(async (id) => {
      return notificationsStore.find((n) => String(n._id) === String(id)) || null;
    }),
    updateMany: vi.fn(async (filter) => {
      for (const n of notificationsStore) {
        if (String(n.recipient) === String(filter.recipient)) {
          n.isRead = true;
        }
      }
      return { acknowledged: true };
    }),
  },
}));

const { default: app } = await import("../src/app.js");

describe("Phase 5 – Notifications & Resolution Feedback", () => {
  let studentAgent;
  let otherStudentAgent;
  let studentUser;
  let otherStudentUser;
  let staffUser;
  let resolvedComplaint;
  let pendingComplaint;

  beforeEach(async () => {
    usersStore.length = 0;
    complaintsStore.length = 0;
    historyStore.length = 0;
    notificationsStore.length = 0;
    objIdCounter = 1;

    const pass = await bcrypt.hash("Pass12345", 4);
    studentUser = makeUserDoc({
      name: "Student One",
      email: "student1@college.edu",
      password: pass,
      role: "student",
    });
    otherStudentUser = makeUserDoc({
      name: "Student Two",
      email: "student2@college.edu",
      password: pass,
      role: "student",
    });
    staffUser = makeUserDoc({
      name: "Staff Member",
      email: "staff@college.edu",
      password: pass,
      role: "staff",
    });
    usersStore.push(studentUser, otherStudentUser, staffUser);

    resolvedComplaint = {
      _id: nextObjectId(),
      complaintId: "FMC-1001",
      title: "Broken AC",
      status: "resolved",
      submittedBy: studentUser._id,
      assignedTo: staffUser._id,
      feedback: undefined,
      async save() {
        return this;
      },
    };

    pendingComplaint = {
      _id: nextObjectId(),
      complaintId: "FMC-1002",
      title: "Loose Desk",
      status: "pending",
      submittedBy: studentUser._id,
      assignedTo: null,
      async save() {
        return this;
      },
    };

    complaintsStore.push(resolvedComplaint, pendingComplaint);

    notificationsStore.push(
      {
        _id: nextObjectId(),
        recipient: studentUser._id,
        complaint: resolvedComplaint._id,
        title: "Complaint Resolved",
        message: "Your AC issue is resolved.",
        type: "complaint_resolved",
        isRead: false,
        createdAt: new Date(),
        async save() {
          return this;
        },
      },
      {
        _id: nextObjectId(),
        recipient: otherStudentUser._id,
        complaint: pendingComplaint._id,
        title: "Other User Notification",
        message: "Should not be visible to student 1",
        type: "complaint_submitted",
        isRead: false,
        createdAt: new Date(),
        async save() {
          return this;
        },
      }
    );

    studentAgent = request.agent(app);
    await studentAgent.post("/api/v1/auth/login").send({
      email: "student1@college.edu",
      password: "Pass12345",
    });

    otherStudentAgent = request.agent(app);
    await otherStudentAgent.post("/api/v1/auth/login").send({
      email: "student2@college.edu",
      password: "Pass12345",
    });
  });

  it("retrieves only user's own notifications and enforces ownership on mark-as-read", async () => {
    const listRes = await studentAgent.get("/api/v1/notifications");
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.notifications).toHaveLength(1);
    expect(listRes.body.data.unreadCount).toBe(1);

    const otherNotifId = notificationsStore[1]._id;
    const forbiddenRes = await studentAgent.patch(
      `/api/v1/notifications/${otherNotifId}/read`
    );
    expect(forbiddenRes.status).toBe(403);

    const ownNotifId = notificationsStore[0]._id;
    const readRes = await studentAgent.patch(
      `/api/v1/notifications/${ownNotifId}/read`
    );
    expect(readRes.status).toBe(200);
    expect(readRes.body.data.notification.isRead).toBe(true);
  });

  it("submits feedback to close a resolved complaint and prevents duplicate feedback", async () => {
    const pendingRes = await studentAgent
      .post(`/api/v1/complaints/${pendingComplaint._id}/feedback`)
      .send({ action: "close", rating: 5 });
    expect(pendingRes.status).toBe(400);

    const okRes = await studentAgent
      .post(`/api/v1/complaints/${resolvedComplaint._id}/feedback`)
      .send({
        action: "close",
        rating: 5,
        comment: "Fixed quickly and cleanly!",
      });
    expect(okRes.status).toBe(200);
    expect(okRes.body.data.complaint.status).toBe("closed");
    expect(okRes.body.data.complaint.feedback.rating).toBe(5);
    expect(historyStore[0].action).toBe("closed");

    // Cannot submit again once closed
    const dupRes = await studentAgent
      .post(`/api/v1/complaints/${resolvedComplaint._id}/feedback`)
      .send({ action: "close", rating: 4 });
    expect(dupRes.status).toBe(400);
  });

  it("allows student to reopen a resolved complaint and notifies assigned staff", async () => {
    const res = await studentAgent
      .post(`/api/v1/complaints/${resolvedComplaint._id}/feedback`)
      .send({
        action: "reopen",
        comment: "AC is still blowing warm air after 10 minutes.",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.complaint.status).toBe("reopened");
    expect(historyStore[0].action).toBe("reopened");

    const staffNotif = notificationsStore.find(
      (n) =>
        String(n.recipient) === String(staffUser._id) &&
        n.type === "complaint_reopened"
    );
    expect(staffNotif).toBeDefined();
  });
});
