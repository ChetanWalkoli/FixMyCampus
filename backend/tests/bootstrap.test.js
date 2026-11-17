import { describe, it, expect, beforeEach, vi } from "vitest";
import bcrypt from "bcrypt";

const usersStore = [];
let idCounter = 1;

vi.mock("../src/models/User.js", () => ({
  default: {
    findOne: vi.fn(async (query) => {
      return (
        usersStore.find((u) => {
          if (query.role && u.role !== query.role) return false;
          if (query.isActive !== undefined && u.isActive !== query.isActive)
            return false;
          if (query.email && u.email !== query.email) return false;
          return true;
        }) || null
      );
    }),
    create: vi.fn(async (data) => {
      const hashedPassword = await bcrypt.hash(data.password, 4);
      const doc = {
        _id: String(idCounter++),
        ...data,
        password: hashedPassword,
      };
      usersStore.push(doc);
      return doc;
    }),
  },
}));

const { createBootstrapAdmin } = await import(
  "../src/scripts/bootstrapAdmin.js"
);

describe("Phase B – Secure Admin Bootstrap", () => {
  beforeEach(() => {
    usersStore.length = 0;
    idCounter = 1;
  });

  it("creates the first admin with hashed password when no active admin exists", async () => {
    const admin = await createBootstrapAdmin({
      name: "Initial Admin",
      email: "chief.admin@college.edu",
      password: "StrongPassword123",
    });

    expect(admin.role).toBe("admin");
    expect(admin.email).toBe("chief.admin@college.edu");
    expect(usersStore[0].password).not.toBe("StrongPassword123");
    expect(
      await bcrypt.compare("StrongPassword123", usersStore[0].password)
    ).toBe(true);
  });

  it("refuses to create a second bootstrap admin if an active admin already exists", async () => {
    await createBootstrapAdmin({
      name: "First Admin",
      email: "first@college.edu",
      password: "StrongPassword123",
    });

    await expect(
      createBootstrapAdmin({
        name: "Second Admin",
        email: "second@college.edu",
        password: "StrongPassword123",
      })
    ).rejects.toThrow(/already exists/i);
  });

  it("rejects weak passwords or invalid emails", async () => {
    await expect(
      createBootstrapAdmin({
        name: "Admin",
        email: "not-an-email",
        password: "StrongPassword123",
      })
    ).rejects.toThrow(/valid email/i);

    await expect(
      createBootstrapAdmin({
        name: "Admin",
        email: "admin@college.edu",
        password: "weak",
      })
    ).rejects.toThrow(/at least 8 characters/i);
  });
});
