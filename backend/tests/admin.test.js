import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-vitest-only";
process.env.JWT_EXPIRES_IN = "1d";

const usersStore = [];
const complaintsStore = [];
const historyStore = [];
let objIdCounter = 1;

const nextObjectId = () => String(objIdCounter++).padStart(24, "0");

const makeUserDoc = (data) => ({
  _id: nextObjectId(),
  name: data.name,
  email: data.email.toLowerCase(),
  password: data.password,
  role: data.role || "student",
  department: data.department,
  studentId: data.studentId,
  isActive: data.isActive ?? true,
  createdAt: new Date(),
  async comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  },
  async save() {
    return this;
  },
});

const makeComplaintDoc = (data) => ({
  _id: nextObjectId(),
  complaintId: data.complaintId,
  title: data.title,
  description: data.description,
  category: data.category,
  location: data.location,
  priority: data.priority || "medium",
  status: data.status || "pending",
  images: [],
  resolutionProof: [],
  submittedBy: data.submittedBy,
  assignedTo: data.assignedTo || null,
  createdAt: new Date(),
  updatedAt: new Date(),
  async save() {
    return this;
  },
});

vi.mock("../src/models/User.js", () => ({
  default: {
    findOne: vi.fn((query) => {
      const found =
        usersStore.find((u) => {
          if (query._id && String(u._id) !== String(query._id)) return false;
          if (query.email && u.email !== query.email) return false;
          if (query.role && u.role !== query.role) return false;
          return true;
        }) || null;
      return {
        select: vi.fn(async () => found),
        then: (resolve, reject) => Promise.resolve(found).then(resolve, reject),
      };
    }),
    findById: vi.fn(async (id) => {
      return usersStore.find((u) => u._id === String(id)) || null;
    }),
    find: vi.fn((filter) => {
      const matched = usersStore.filter((u) =>
        filter?.role ? u.role === filter.role : true
      );
      return {
        sort: vi.fn(async () => matched),
      };
    }),
    create: vi.fn(async (data) => {
      const hashedPassword = await bcrypt.hash(data.password, 4);
      const doc = makeUserDoc({ ...data, password: hashedPassword });
      usersStore.push(doc);
      return doc;
    }),
  },
}));

vi.mock("../src/models/Complaint.js", () => ({
  default: {
    find: vi.fn((filter = {}) => {
      const matched = complaintsStore.filter((c) => {
        if (filter.status && c.status !== filter.status) return false;
        if (filter.priority && c.priority !== filter.priority) return false;
        if (filter.category && c.category !== filter.category) return false;
        return true;
      });
      const chain = {
        sort: vi.fn(() => chain),
        skip: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        populate: vi.fn(() => chain),
        select: vi.fn(async () => matched),
        then: (resolve, reject) => Promise.resolve(matched).then(resolve, reject),
      };
      return chain;
    }),
    countDocuments: vi.fn(async (filter = {}) => {
      return complaintsStore.filter((c) => {
        if (filter.status && c.status !== filter.status) return false;
        return true;
      }).length;
    }),
    findOne: vi.fn((query) => {
      const found =
        complaintsStore.find((c) =>
          query._id
            ? String(c._id) === String(query._id)
            : c.complaintId === query.complaintId
        ) || null;
      const chain = {
        populate: vi.fn(() => chain),
        then: (resolve, reject) => Promise.resolve(found).then(resolve, reject),
      };
      return chain;
    }),
    findById: vi.fn((id) => {
      const found =
        complaintsStore.find((c) => String(c._id) === String(id)) || null;
      const chain = {
        populate: vi.fn(() => chain),
        then: (resolve, reject) => Promise.resolve(found).then(resolve, reject),
      };
      return chain;
    }),
    aggregate: vi.fn(async () => []),
  },
}));

vi.mock("../src/models/ComplaintHistory.js", () => ({
  default: {
    create: vi.fn(async (data) => {
      const doc = { _id: nextObjectId(), ...data, createdAt: new Date() };
      historyStore.push(doc);
      return doc;
    }),
    find: vi.fn((filter) => {
      const matched = historyStore.filter(
        (h) => String(h.complaint) === String(filter.complaint)
      );
      return {
        sort: vi.fn(() => ({
          populate: vi.fn(async () => matched),
        })),
      };
    }),
  },
}));

const { default: app } = await import("../src/app.js");

describe("Phase 3 – Admin Complaint & Staff Management", () => {
  let adminAgent;
  let studentUser;
  let staffUser;
  let complaint;

  beforeEach(async () => {
    usersStore.length = 0;
    complaintsStore.length = 0;
    historyStore.length = 0;
    objIdCounter = 1;

    const adminPass = await bcrypt.hash("AdminPass123", 4);
    usersStore.push(
      makeUserDoc({
        name: "Campus Admin",
        email: "admin@college.edu",
        password: adminPass,
        role: "admin",
      })
    );

    const pass = await bcrypt.hash("Pass12345", 4);
    studentUser = makeUserDoc({
      name: "Student One",
      email: "student@college.edu",
      password: pass,
      role: "student",
    });
    usersStore.push(studentUser);

    staffUser = makeUserDoc({
      name: "Ramesh Electrician",
      email: "ramesh@college.edu",
      password: pass,
      role: "staff",
      department: "Electrical",
      isActive: true,
    });
    usersStore.push(staffUser);

    complaint = makeComplaintDoc({
      complaintId: "FMC-1001",
      title: "AC not cooling in Lab 1",
      description: "Air conditioner compressor is not turning on.",
      category: "electrical",
      priority: "medium",
      status: "pending",
      location: { block: "IT Block", room: "Lab 1" },
      submittedBy: studentUser._id,
    });
    complaintsStore.push(complaint);

    adminAgent = request.agent(app);
    await adminAgent.post("/api/v1/auth/login").send({
      email: "admin@college.edu",
      password: "AdminPass123",
    });
  });

  it("blocks non-admin users from /admin/complaints with 403", async () => {
    const studentAgent = request.agent(app);
    await studentAgent.post("/api/v1/auth/login").send({
      email: "student@college.edu",
      password: "Pass12345",
    });

    const res = await studentAgent.get("/api/v1/admin/complaints");
    expect(res.status).toBe(403);
  });

  it("returns paginated complaints and summary counts for admin", async () => {
    const res = await adminAgent.get("/api/v1/admin/complaints");
    expect(res.status).toBe(200);
    expect(res.body.data.complaints).toHaveLength(1);
    expect(res.body.data.summary.total).toBe(1);
    expect(res.body.data.summary.pending).toBe(1);
  });

  it("assigns an active staff member and rejects non-staff user assignment", async () => {
    const badRes = await adminAgent
      .patch(`/api/v1/admin/complaints/${complaint._id}/assign`)
      .send({ staffId: studentUser._id });
    expect(badRes.status).toBe(400);

    const okRes = await adminAgent
      .patch(`/api/v1/admin/complaints/${complaint._id}/assign`)
      .send({ staffId: staffUser._id });
    expect(okRes.status).toBe(200);
    expect(okRes.body.data.complaint.status).toBe("assigned");
    expect(String(okRes.body.data.complaint.assignedTo)).toBe(staffUser._id);
    expect(historyStore[0].action).toBe("assigned");
  });

  it("rejects a pending complaint with reason and records history", async () => {
    const missingReason = await adminAgent
      .patch(`/api/v1/admin/complaints/${complaint._id}/review`)
      .send({ action: "reject" });
    expect(missingReason.status).toBe(400);

    const res = await adminAgent
      .patch(`/api/v1/admin/complaints/${complaint._id}/review`)
      .send({ action: "reject", note: "Duplicate of FMC-1000" });
    expect(res.status).toBe(200);
    expect(res.body.data.complaint.status).toBe("rejected");
    expect(historyStore[0].action).toBe("rejected");
  });

  it("updates complaint priority and manages staff accounts", async () => {
    const prioRes = await adminAgent
      .patch(`/api/v1/admin/complaints/${complaint._id}/priority`)
      .send({ priority: "urgent" });
    expect(prioRes.status).toBe(200);
    expect(prioRes.body.data.complaint.priority).toBe("urgent");

    const createStaffRes = await adminAgent.post("/api/v1/admin/staff").send({
      name: "Suresh Plumber",
      email: "suresh@college.edu",
      password: "StaffPassword123",
      department: "Plumbing",
    });
    expect(createStaffRes.status).toBe(201);
    expect(createStaffRes.body.data.staff.role).toBe("staff");

    const toggleRes = await adminAgent
      .patch(`/api/v1/admin/staff/${staffUser._id}`)
      .send({ isActive: false });
    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.data.staff.isActive).toBe(false);
  });

  it("returns analytics summary and handles empty aggregation results", async () => {
    const res = await adminAgent.get("/api/v1/admin/analytics");
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(0);
    expect(res.body.data.averageResolutionHours).toBe(0);
    expect(res.body.data.categoryBreakdown).toEqual([]);
    expect(res.body.data.staffWorkload).toEqual([]);
  });
});
