import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-vitest-only";
process.env.JWT_EXPIRES_IN = "1d";

const usersStore = [];
let idCounter = 1;

const makeUserDoc = (data) => {
  const doc = {
    _id: String(idCounter++),
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
  };
  return doc;
};

vi.mock("../src/models/User.js", () => {
  return {
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
  };
});

const { default: app } = await import("../src/app.js");

describe("Phase 1 – Authentication & Role-Based Access", () => {
  beforeEach(() => {
    usersStore.length = 0;
    idCounter = 1;
  });

  it("registers a student, forces role=student, hashes password, and sets HTTP-only cookie", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Chetan Walkoli",
      email: "chetan@college.edu",
      password: "StrongPassword123",
      department: "Computer Engineering",
      studentId: "TCOB59",
      role: "admin", // Should be ignored
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe("student");
    expect(res.body.data.user.password).toBeUndefined();
    expect(usersStore[0].password).not.toBe("StrongPassword123");

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain("fmc_token=");
    expect(cookies[0]).toContain("HttpOnly");
  });

  it("rejects duplicate email registration with 409", async () => {
    await request(app).post("/api/v1/auth/register").send({
      name: "Student One",
      email: "dup@college.edu",
      password: "StrongPassword123",
    });

    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Student Two",
      email: "dup@college.edu",
      password: "StrongPassword123",
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("logs in with valid credentials and fails with incorrect password", async () => {
    await request(app).post("/api/v1/auth/register").send({
      name: "Login User",
      email: "login@college.edu",
      password: "CorrectPassword123",
    });

    const badRes = await request(app).post("/api/v1/auth/login").send({
      email: "login@college.edu",
      password: "WrongPassword123",
    });
    expect(badRes.status).toBe(401);

    const okRes = await request(app).post("/api/v1/auth/login").send({
      email: "login@college.edu",
      password: "CorrectPassword123",
    });
    expect(okRes.status).toBe(200);
    expect(okRes.body.data.user.email).toBe("login@college.edu");
    expect(okRes.headers["set-cookie"][0]).toContain("fmc_token=");
  });

  it("returns authenticated user on GET /auth/me and blocks unauthenticated requests", async () => {
    const unauthRes = await request(app).get("/api/v1/auth/me");
    expect(unauthRes.status).toBe(401);

    const agent = request.agent(app);
    await agent.post("/api/v1/auth/register").send({
      name: "Me User",
      email: "me@college.edu",
      password: "StrongPassword123",
    });

    const meRes = await agent.get("/api/v1/auth/me");
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe("me@college.edu");

    const logoutRes = await agent.post("/api/v1/auth/logout");
    expect(logoutRes.status).toBe(200);

    const afterLogoutRes = await agent.get("/api/v1/auth/me");
    expect(afterLogoutRes.status).toBe(401);
  });

  it("enforces admin-only access on POST /admin/users", async () => {
    // Register a student
    const studentAgent = request.agent(app);
    await studentAgent.post("/api/v1/auth/register").send({
      name: "Student",
      email: "student@college.edu",
      password: "StrongPassword123",
    });

    const forbiddenRes = await studentAgent.post("/api/v1/admin/users").send({
      name: "Electrician",
      email: "staff@college.edu",
      password: "StaffPassword123",
      role: "staff",
    });
    expect(forbiddenRes.status).toBe(403);

    // Seed an admin directly in store and log in
    const adminPassword = await bcrypt.hash("AdminPassword123", 4);
    usersStore.push(
      makeUserDoc({
        name: "Campus Admin",
        email: "admin@college.edu",
        password: adminPassword,
        role: "admin",
      })
    );

    const adminAgent = request.agent(app);
    await adminAgent.post("/api/v1/auth/login").send({
      email: "admin@college.edu",
      password: "AdminPassword123",
    });

    const createdRes = await adminAgent.post("/api/v1/admin/users").send({
      name: "Electrician",
      email: "staff@college.edu",
      password: "StaffPassword123",
      role: "staff",
      department: "Electrical",
    });

    expect(createdRes.status).toBe(201);
    expect(createdRes.body.data.user.role).toBe("staff");
  });
});
