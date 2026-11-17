import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-vitest-only";
process.env.JWT_EXPIRES_IN = "1d";

const usersStore = [];
const invitationsStore = [];
const sentEmails = [];
let objIdCounter = 1;

const nextObjectId = () => String(objIdCounter++).padStart(24, "0");

const makeUserDoc = (data) => ({
  _id: nextObjectId(),
  name: data.name,
  email: data.email.toLowerCase(),
  password: data.password,
  role: data.role || "student",
  department: data.department,
  employeeId: data.employeeId,
  isActive: data.isActive ?? true,
  tokenVersion: data.tokenVersion ?? 0,
  passwordResetTokenHash: data.passwordResetTokenHash,
  passwordResetExpiresAt: data.passwordResetExpiresAt,
  createdAt: new Date(),
  async comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  },
  async save() {
    if (this.password && !this.password.startsWith("$2")) {
      this.password = await bcrypt.hash(this.password, 4);
    }
    return this;
  },
});

vi.mock("../src/services/emailService.js", () => ({
  sendInvitationEmail: vi.fn(async (payload) => {
    sentEmails.push({ kind: "invite", ...payload });
    return { messageId: "mock-invite-id" };
  }),
  sendPasswordResetEmail: vi.fn(async (payload) => {
    sentEmails.push({ kind: "reset", ...payload });
    return { messageId: "mock-reset-id" };
  }),
}));

vi.mock("../src/models/User.js", () => ({
  default: {
    findOne: vi.fn((query = {}) => {
      const found =
        usersStore.find((u) => {
          if (query.email && u.email !== query.email) return false;
          if (query._id && String(u._id) !== String(query._id)) return false;
          return true;
        }) || null;
      const chain = {
        select: vi.fn(async () => found),
        then: (resolve, reject) => Promise.resolve(found).then(resolve, reject),
      };
      return chain;
    }),
    findOneAndUpdate: vi.fn((filter, update) => {
      const found =
        usersStore.find((u) => {
          if (
            filter.passwordResetTokenHash &&
            u.passwordResetTokenHash !== filter.passwordResetTokenHash
          ) {
            return false;
          }
          if (
            filter.passwordResetExpiresAt?.$gt &&
            (!u.passwordResetExpiresAt ||
              u.passwordResetExpiresAt <= filter.passwordResetExpiresAt.$gt)
          ) {
            return false;
          }
          if (filter.isActive !== undefined && u.isActive !== filter.isActive) {
            return false;
          }
          return true;
        }) || null;

      if (found && update?.$unset) {
        for (const k of Object.keys(update.$unset)) {
          delete found[k];
        }
      }
      const chain = {
        select: vi.fn(async () => found),
        then: (resolve, reject) => Promise.resolve(found).then(resolve, reject),
      };
      return chain;
    }),
    findById: vi.fn((id) => {
      const found =
        usersStore.find((u) => String(u._id) === String(id)) || null;
      const chain = {
        select: vi.fn(async () => found),
        then: (resolve, reject) => Promise.resolve(found).then(resolve, reject),
      };
      return chain;
    }),
    find: vi.fn((filter = {}) => {
      const matched = usersStore.filter((u) => {
        if (filter.role && u.role !== filter.role) return false;
        if (filter.isActive !== undefined && u.isActive !== filter.isActive)
          return false;
        return true;
      });
      return {
        sort: vi.fn(async () => matched),
      };
    }),
    countDocuments: vi.fn(async (filter = {}) => {
      return usersStore.filter((u) => {
        if (filter.role && u.role !== filter.role) return false;
        if (filter.isActive !== undefined && u.isActive !== filter.isActive)
          return false;
        return true;
      }).length;
    }),
    create: vi.fn(async (data) => {
      const hashedPassword = await bcrypt.hash(data.password, 4);
      const doc = makeUserDoc({ ...data, password: hashedPassword });
      usersStore.push(doc);
      return doc;
    }),
  },
}));

vi.mock("../src/models/Invitation.js", () => ({
  default: {
    findOne: vi.fn(async (query = {}) => {
      return (
        invitationsStore.find((inv) => {
          if (query.email && inv.email !== query.email) return false;
          if (query.tokenHash && inv.tokenHash !== query.tokenHash) return false;
          if (query.status && inv.status !== query.status) return false;
          if (query.expiresAt?.$gt && inv.expiresAt <= query.expiresAt.$gt)
            return false;
          return true;
        }) || null
      );
    }),
    findOneAndUpdate: vi.fn(async (filter, update) => {
      const inv =
        invitationsStore.find((i) => {
          if (filter.tokenHash && i.tokenHash !== filter.tokenHash) return false;
          if (filter.status && i.status !== filter.status) return false;
          if (filter.expiresAt?.$gt && i.expiresAt <= filter.expiresAt.$gt)
            return false;
          return true;
        }) || null;

      if (!inv) return null;
      const snapshot = { ...inv };
      if (update?.$set) {
        Object.assign(inv, update.$set);
      }
      return snapshot;
    }),
    findById: vi.fn((id) => {
      const found =
        invitationsStore.find((i) => String(i._id) === String(id)) || null;
      const chain = {
        populate: vi.fn(async () => found),
        then: (resolve, reject) => Promise.resolve(found).then(resolve, reject),
      };
      return chain;
    }),
    find: vi.fn(() => {
      const chain = {
        sort: vi.fn(() => chain),
        populate: vi.fn(async () => invitationsStore),
      };
      return chain;
    }),
    create: vi.fn(async (data) => {
      const doc = {
        _id: nextObjectId(),
        ...data,
        createdAt: new Date(),
        async save() {
          return this;
        },
      };
      invitationsStore.push(doc);
      return doc;
    }),
    findByIdAndDelete: vi.fn(async (id) => {
      const idx = invitationsStore.findIndex(
        (i) => String(i._id) === String(id)
      );
      if (idx !== -1) invitationsStore.splice(idx, 1);
    }),
  },
}));

const { default: app } = await import("../src/app.js");

describe("Phases C, D & E – Invitations, Activation, User Management & Password Reset", () => {
  let adminAgent;
  let studentAgent;
  let adminUser;
  let studentUser;

  beforeEach(async () => {
    usersStore.length = 0;
    invitationsStore.length = 0;
    sentEmails.length = 0;
    objIdCounter = 1;

    const pass = await bcrypt.hash("StrongPass123", 4);
    adminUser = makeUserDoc({
      name: "Chief Admin",
      email: "admin@college.edu",
      password: pass,
      role: "admin",
      isActive: true,
    });
    studentUser = makeUserDoc({
      name: "Student One",
      email: "student@college.edu",
      password: pass,
      role: "student",
      isActive: true,
    });
    usersStore.push(adminUser, studentUser);

    adminAgent = request.agent(app);
    await adminAgent.post("/api/v1/auth/login").send({
      email: "admin@college.edu",
      password: "StrongPass123",
    });

    studentAgent = request.agent(app);
    await studentAgent.post("/api/v1/auth/login").send({
      email: "student@college.edu",
      password: "StrongPass123",
    });
  });

  it("blocks non-admins from inviting users (403) and allows admin invitation without returning raw token", async () => {
    const forbidden = await studentAgent.post("/api/v1/admin/users/invite").send({
      name: "New Staff",
      email: "newstaff@college.edu",
      role: "staff",
      department: "Electrical",
    });
    expect(forbidden.status).toBe(403);

    const ok = await adminAgent.post("/api/v1/admin/users/invite").send({
      name: "New Staff",
      email: "newstaff@college.edu",
      role: "staff",
      department: "Electrical",
      employeeId: "EMP-42",
    });
    expect(ok.status).toBe(201);
    expect(ok.body.data.invitation.email).toBe("newstaff@college.edu");
    expect(ok.body.data.invitation.tokenHash).toBeUndefined();
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].kind).toBe("invite");
    expect(sentEmails[0].activationUrl).toContain("/activate-account?token=");
  });

  it("activates account with valid token, hashes password, and blocks token reuse", async () => {
    await adminAgent.post("/api/v1/admin/users/invite").send({
      name: "Invited Plumber",
      email: "plumber@college.edu",
      role: "staff",
      department: "Plumbing",
    });

    const rawToken = new URL(sentEmails[0].activationUrl).searchParams.get(
      "token"
    );

    const activateRes = await request(app)
      .post("/api/v1/auth/activate-account")
      .send({ token: rawToken, password: "NewStrongPassword1" });
    expect(activateRes.status).toBe(201);
    expect(activateRes.body.data.user.role).toBe("staff");

    // Token reuse must fail
    const reuseRes = await request(app)
      .post("/api/v1/auth/activate-account")
      .send({ token: rawToken, password: "AnotherPassword1" });
    expect(reuseRes.status).toBe(400);

    // Activated user can log in
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "plumber@college.edu",
      password: "NewStrongPassword1",
    });
    expect(loginRes.status).toBe(200);
  });

  it("rejects expired, revoked, or invalid invitation tokens", async () => {
    await adminAgent.post("/api/v1/admin/users/invite").send({
      name: "Revoked Staff",
      email: "revoked@college.edu",
      role: "staff",
    });

    const rawToken = new URL(sentEmails[0].activationUrl).searchParams.get(
      "token"
    );
    const invId = invitationsStore[0]._id;

    const revokeRes = await adminAgent.delete(
      `/api/v1/admin/invitations/${invId}`
    );
    expect(revokeRes.status).toBe(200);

    const actRevoked = await request(app)
      .post("/api/v1/auth/activate-account")
      .send({ token: rawToken, password: "StrongPassword123" });
    expect(actRevoked.status).toBe(400);
    expect(actRevoked.body.message).toMatch(/revoked/i);

    const invalidRes = await request(app)
      .post("/api/v1/auth/activate-account")
      .send({ token: "nonexistenttokenvalue123", password: "StrongPassword123" });
    expect(invalidRes.status).toBe(400);
  });

  it("protects the last active admin from deactivation or demotion and blocks inactive user login", async () => {
    const selfDeactivate = await adminAgent
      .patch(`/api/v1/admin/users/${adminUser._id}/status`)
      .send({ isActive: false });
    expect(selfDeactivate.status).toBe(400);

    const selfDemote = await adminAgent
      .patch(`/api/v1/admin/users/${adminUser._id}`)
      .send({ role: "staff" });
    expect(selfDemote.status).toBe(400);

    // Deactivate student -> student cannot log in
    const deactStudent = await adminAgent
      .patch(`/api/v1/admin/users/${studentUser._id}/status`)
      .send({ isActive: false });
    expect(deactStudent.status).toBe(200);

    const blockedLogin = await request(app).post("/api/v1/auth/login").send({
      email: "student@college.edu",
      password: "StrongPass123",
    });
    expect(blockedLogin.status).toBe(403);
  });

  it("supports non-enumerating forgot-password, single-use reset-password, and session invalidation", async () => {
    const unknownRes = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "nobody@college.edu" });
    expect(unknownRes.status).toBe(200);
    expect(sentEmails).toHaveLength(0);

    const knownRes = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "student@college.edu" });
    expect(knownRes.status).toBe(200);
    expect(knownRes.body.message).toBe(unknownRes.body.message);
    expect(sentEmails).toHaveLength(1);

    const rawResetToken = new URL(sentEmails[0].resetUrl).searchParams.get(
      "token"
    );

    const resetRes = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token: rawResetToken, password: "ResetPassword99" });
    expect(resetRes.status).toBe(200);

    // Old student session is now invalidated because tokenVersion incremented
    const oldSessionMe = await studentAgent.get("/api/v1/auth/me");
    expect(oldSessionMe.status).toBe(401);

    // Reset token cannot be reused
    const reuseReset = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token: rawResetToken, password: "ResetPassword100" });
    expect(reuseReset.status).toBe(400);
  });

  it("requires current password on PATCH /auth/change-password", async () => {
    const wrongCurrent = await studentAgent
      .patch("/api/v1/auth/change-password")
      .send({
        currentPassword: "WrongPassword1",
        newPassword: "NewPassword123",
      });
    expect(wrongCurrent.status).toBe(401);

    const okChange = await studentAgent
      .patch("/api/v1/auth/change-password")
      .send({
        currentPassword: "StrongPass123",
        newPassword: "NewPassword123",
      });
    expect(okChange.status).toBe(200);
  });
});
