import readline from "node:readline";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { z } from "zod";
import connectDB from "../config/db.js";
import User from "../models/User.js";

export const bootstrapAdminSchema = z.object({
  name: z
    .string({ required_error: "Admin name is required" })
    .trim()
    .min(2, "Admin name must be at least 2 characters")
    .max(80, "Admin name cannot exceed 80 characters"),
  email: z
    .string({ required_error: "Admin email is required" })
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password cannot exceed 72 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const promptText = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

const promptHidden = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    const originalWrite = rl._writeToOutput;
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (stringToWrite === question || stringToWrite.includes("\n")) {
        originalWrite.call(rl, stringToWrite);
      } else {
        originalWrite.call(rl, "*");
      }
    };

    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });

/**
 * Create the first active Admin account if none exists.
 */
export const createBootstrapAdmin = async ({ name, email, password }) => {
  const parsed = bootstrapAdminSchema.safeParse({ name, email, password });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    throw new Error(msg);
  }

  const existingAdmin = await User.findOne({
    role: "admin",
    isActive: true,
  });

  if (existingAdmin) {
    throw new Error(
      "An active Admin account already exists. Bootstrap is disabled; use the Admin Dashboard to invite additional Admins."
    );
  }

  const duplicateEmail = await User.findOne({ email: parsed.data.email });
  if (duplicateEmail) {
    throw new Error("An account with this email already exists.");
  }

  const admin = await User.create({
    name: parsed.data.name,
    email: parsed.data.email,
    password: parsed.data.password,
    role: "admin",
    department: "Administration",
    isActive: true,
  });

  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
};

const runCli = async () => {
  try {
    await connectDB();

    const name =
      process.env.ADMIN_NAME || (await promptText("Admin full name: "));
    const email =
      process.env.ADMIN_EMAIL || (await promptText("Admin email: "));
    const password =
      process.env.ADMIN_PASSWORD ||
      (await promptHidden("Admin password (min 8 chars, upper/lower/digit): "));

    const created = await createBootstrapAdmin({ name, email, password });
    console.log(
      `Bootstrap Admin created successfully: ${created.name} <${created.email}> (${created.role})`
    );
  } catch (error) {
    console.error(`Admin bootstrap failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

const isDirectExecution =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectExecution) {
  runCli();
}
