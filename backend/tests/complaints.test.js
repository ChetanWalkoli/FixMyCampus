import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-vitest-only";
process.env.JWT_EXPIRES_IN = "1d";

const usersStore = [];
const complaintsStore = [];
const historyStore = [];
let seqCounter = 1000;
let objIdCounter = 1;

const nextObjectId = () =>
  String(objIdCounter++).padStart(24, "0");

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
});

vi.mock("../src/models/User.js", () => ({
  default: {
    findOne: vi.fn((query) => {
      const found = usersStore.find((u) => u.email === query.email) || null;
      return {
        select: vi.fn(async () => found),
        then: (resolve, reject) => Promise.resolve(found).then(resolve, reject),
      };
    }),
    findById: vi.fn(async (id) => {
      return usersStore.find((u) => u._id === String(id)) || null;
    }),
    create: vi.fn(async (data) => {
      const hashedPassword = await bcrypt.hash(data.password, 4);
      const doc = makeUserDoc({ ...data, password: hashedPassword });
      usersStore.push(doc);
      return doc;
    }),
  },
}));

vi.mock("../src/utils/generateComplaintId.js", () => ({
  generateComplaintId: vi.fn(async () => {
    seqCounter += 1;
    return `FMC-${seqCounter}`;
  }),
}));

vi.mock("../src/services/uploadService.js", () => ({
  uploadImageBuffer: vi.fn(async () => ({
    url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    publicId: "fixmycampus/complaints/sample",
  })),
}));

vi.mock("../src/models/Complaint.js", () => ({
  default: {
    create: vi.fn(async (data) => {
      const doc = {
        _id: nextObjectId(),
        ...data,
        assignedTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      complaintsStore.push(doc);
      return doc;
    }),
    find: vi.fn((filter) => {
      const matched = complaintsStore.filter((c) => {
        if (filter.submittedBy && String(c.submittedBy) !== String(filter.submittedBy)) {
          return false;
        }
        if (filter.status && c.status !== filter.status) return false;
        if (filter.category && c.category !== filter.category) return false;
        return true;
      });
      return {
        sort: vi.fn(() => ({
          populate: vi.fn(async () => matched),
        })),
        select: vi.fn(async () => matched),
      };
    }),
    findOne: vi.fn((query) => {
      const found =
        complaintsStore.find((c) =>
          query._id ? String(c._id) === String(query._id) : c.complaintId === query.complaintId
        ) || null;
      const hydrated = found
        ? {
            ...found,
            submittedBy:
              usersStore.find((u) => String(u._id) === String(found.submittedBy)) ||
              found.submittedBy,
          }
        : null;
      const result = {
        populate: vi.fn(() => result),
        then: (resolve, reject) =>
          Promise.resolve(hydrated).then(resolve, reject),
      };
      return result;
    }),
  },
}));

vi.mock("../src/models/ComplaintHistory.js", () => ({
  default: {
    create: vi.fn(async (data) => {
      const doc = {
        _id: nextObjectId(),
        ...data,
        createdAt: new Date(),
      };
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

describe("Phase 2 – Student Complaints API", () => {
  let studentAgent;
  let otherStudentAgent;

  beforeEach(async () => {
    usersStore.length = 0;
    complaintsStore.length = 0;
    historyStore.length = 0;
    seqCounter = 1000;
    objIdCounter = 1;

    studentAgent = request.agent(app);
    await studentAgent.post("/api/v1/auth/register").send({
      name: "Student One",
      email: "student1@college.edu",
      password: "Password123",
      department: "Computer",
      studentId: "S101",
    });

    otherStudentAgent = request.agent(app);
    await otherStudentAgent.post("/api/v1/auth/register").send({
      name: "Student Two",
      email: "student2@college.edu",
      password: "Password123",
    });
  });

  it("blocks unauthenticated complaint submission with 401", async () => {
    const res = await request(app).post("/api/v1/complaints").send({
      title: "Broken fan in room 204",
      description: "The ceiling fan is making a loud noise and not spinning.",
      category: "electrical",
      location: { block: "Block A", room: "204" },
    });
    expect(res.status).toBe(401);
  });

  it("creates a complaint with unique ID and initial history entry", async () => {
    const res = await studentAgent.post("/api/v1/complaints").send({
      title: "Broken fan in room 204",
      description: "The ceiling fan is making a loud noise and not spinning.",
      category: "electrical",
      priority: "high",
      location: { block: "Block A", floor: "2nd", room: "204" },
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.complaint.complaintId).toBe("FMC-1001");
    expect(res.body.data.complaint.status).toBe("pending");
    expect(historyStore).toHaveLength(1);
    expect(historyStore[0].action).toBe("submitted");
  });

  it("rejects invalid complaint input with 400", async () => {
    const res = await studentAgent.post("/api/v1/complaints").send({
      title: "Bad",
      description: "Short",
      category: "invalid_cat",
      location: { block: "" },
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("lists only the logged-in student's complaints and summary", async () => {
    await studentAgent.post("/api/v1/complaints").send({
      title: "Leaking tap in washroom",
      description: "Continuous water leakage near Block B ground floor.",
      category: "plumbing",
      location: { block: "Block B", floor: "Ground" },
    });

    await otherStudentAgent.post("/api/v1/complaints").send({
      title: "Wi-Fi down in library",
      description: "No internet connectivity on the second floor.",
      category: "network",
      location: { block: "Library", floor: "2nd" },
    });

    const res = await studentAgent.get("/api/v1/complaints/my");
    expect(res.status).toBe(200);
    expect(res.body.data.complaints).toHaveLength(1);
    expect(res.body.data.complaints[0].title).toBe("Leaking tap in washroom");
    expect(res.body.data.summary.total).toBe(1);
    expect(res.body.data.summary.pending).toBe(1);
  });

  it("prevents a student from viewing another student's complaint (403)", async () => {
    const created = await studentAgent.post("/api/v1/complaints").send({
      title: "Broken projector in lab",
      description: "Projector does not power on during lecture.",
      category: "equipment",
      location: { block: "IT Block", room: "Lab 3" },
    });

    const id = created.body.data.complaint._id;

    const forbiddenRes = await otherStudentAgent.get(`/api/v1/complaints/${id}`);
    expect(forbiddenRes.status).toBe(403);

    const ownerRes = await studentAgent.get(`/api/v1/complaints/${id}`);
    expect(ownerRes.status).toBe(200);
    expect(ownerRes.body.data.complaint.complaintId).toBe("FMC-1001");
    expect(ownerRes.body.data.history).toHaveLength(1);
  });

  it("rejects spoofed image upload with invalid magic bytes", async () => {
    const fakeImageBuffer = Buffer.from("not-really-a-png-file-contents");
    const res = await studentAgent
      .post("/api/v1/complaints")
      .field("title", "Broken chair in room 101")
      .field("description", "One leg of the desk chair is completely broken.")
      .field("category", "furniture")
      .field("location", JSON.stringify({ block: "Main Block", room: "101" }))
      .attach("image", fakeImageBuffer, {
        filename: "fake.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("valid JPEG, PNG, or WebP");
  });
});
