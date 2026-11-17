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
  isActive: data.isActive ?? true,
  createdAt: new Date(),
  async comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
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
  status: data.status || "assigned",
  images: [],
  resolutionProof: [],
  submittedBy: data.submittedBy,
  assignedTo: data.assignedTo || null,
  resolutionNote: undefined,
  resolvedAt: undefined,
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

vi.mock("../src/services/uploadService.js", () => ({
  uploadImageBuffer: vi.fn(async () => ({
    url: "https://res.cloudinary.com/demo/image/upload/proof.png",
    publicId: "fixmycampus/resolutions/proof",
  })),
}));

vi.mock("../src/models/Complaint.js", () => ({
  default: {
    find: vi.fn((filter = {}) => {
      const matched = complaintsStore.filter((c) => {
        if (filter.assignedTo && String(c.assignedTo) !== String(filter.assignedTo)) {
          return false;
        }
        if (filter.status) {
          if (typeof filter.status === "string" && c.status !== filter.status) {
            return false;
          }
          if (filter.status.$in && !filter.status.$in.includes(c.status)) {
            return false;
          }
        }
        return true;
      });
      const chain = {
        sort: vi.fn(() => chain),
        populate: vi.fn(async () => matched),
        select: vi.fn(async () => matched),
      };
      return chain;
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

describe("Phase 4 – Maintenance Staff Workflow", () => {
  let staffAgent;
  let otherStaffAgent;
  let staffUser;
  let otherStaffUser;
  let studentUser;
  let assignedComplaint;
  let unassignedComplaint;

  beforeEach(async () => {
    usersStore.length = 0;
    complaintsStore.length = 0;
    historyStore.length = 0;
    objIdCounter = 1;

    const pass = await bcrypt.hash("StaffPass123", 4);
    studentUser = makeUserDoc({
      name: "Student",
      email: "student@college.edu",
      password: pass,
      role: "student",
    });
    staffUser = makeUserDoc({
      name: "Ramesh Staff",
      email: "ramesh@college.edu",
      password: pass,
      role: "staff",
      department: "Electrical",
    });
    otherStaffUser = makeUserDoc({
      name: "Suresh Staff",
      email: "suresh@college.edu",
      password: pass,
      role: "staff",
      department: "Plumbing",
    });
    usersStore.push(studentUser, staffUser, otherStaffUser);

    assignedComplaint = makeComplaintDoc({
      complaintId: "FMC-1001",
      title: "Power socket sparking",
      description: "Socket near desk 4 is sparking.",
      category: "electrical",
      status: "assigned",
      location: { block: "Main Block", room: "104" },
      submittedBy: studentUser._id,
      assignedTo: staffUser._id,
    });

    unassignedComplaint = makeComplaintDoc({
      complaintId: "FMC-1002",
      title: "Pipe leak",
      description: "Water leaking in corridor.",
      category: "plumbing",
      status: "pending",
      location: { block: "Block B" },
      submittedBy: studentUser._id,
      assignedTo: null,
    });

    complaintsStore.push(assignedComplaint, unassignedComplaint);

    staffAgent = request.agent(app);
    await staffAgent.post("/api/v1/auth/login").send({
      email: "ramesh@college.edu",
      password: "StaffPass123",
    });

    otherStaffAgent = request.agent(app);
    await otherStaffAgent.post("/api/v1/auth/login").send({
      email: "suresh@college.edu",
      password: "StaffPass123",
    });
  });

  it("lists only tasks assigned to the logged-in staff member", async () => {
    const res = await staffAgent.get("/api/v1/staff/complaints");
    expect(res.status).toBe(200);
    expect(res.body.data.complaints).toHaveLength(1);
    expect(res.body.data.complaints[0].complaintId).toBe("FMC-1001");
    expect(res.body.data.summary.assigned).toBe(1);
  });

  it("prevents staff from viewing or updating unassigned/other staff tasks (403)", async () => {
    const viewUnassigned = await staffAgent.get(
      `/api/v1/staff/complaints/${unassignedComplaint._id}`
    );
    expect(viewUnassigned.status).toBe(403);

    const updateOther = await otherStaffAgent
      .patch(`/api/v1/staff/complaints/${assignedComplaint._id}/status`)
      .send({ status: "in_progress" });
    expect(updateOther.status).toBe(403);
  });

  it("enforces valid status transitions and rejects invalid jumps", async () => {
    // Cannot jump directly from assigned -> resolved
    const invalidJump = await staffAgent
      .patch(`/api/v1/staff/complaints/${assignedComplaint._id}/status`)
      .send({ status: "resolved" });
    expect(invalidJump.status).toBe(400);

    // Valid: assigned -> in_progress
    const startRes = await staffAgent
      .patch(`/api/v1/staff/complaints/${assignedComplaint._id}/status`)
      .send({ status: "in_progress", note: "Inspecting wiring" });
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.complaint.status).toBe("in_progress");

    // Upload valid PNG proof (magic bytes)
    const validPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    const proofRes = await staffAgent
      .post(`/api/v1/staff/complaints/${assignedComplaint._id}/proof`)
      .attach("image", validPng, {
        filename: "proof.png",
        contentType: "image/png",
      });
    expect(proofRes.status).toBe(200);
    expect(proofRes.body.data.complaint.resolutionProof).toHaveLength(1);

    // Valid: in_progress -> resolved
    const resolveRes = await staffAgent
      .patch(`/api/v1/staff/complaints/${assignedComplaint._id}/status`)
      .send({
        status: "resolved",
        resolutionNote: "Replaced faulty socket and tested load.",
      });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.complaint.status).toBe("resolved");
    expect(historyStore).toHaveLength(3);

    // Appears in staff work history
    const histRes = await staffAgent.get("/api/v1/staff/history");
    expect(histRes.status).toBe(200);
    expect(histRes.body.data.complaints).toHaveLength(1);
    expect(histRes.body.data.complaints[0].complaintId).toBe("FMC-1001");
  });
});
