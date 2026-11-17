import { z } from "zod";
import { COMPLAINT_PRIORITIES } from "./complaintValidators.js";

export const reviewComplaintSchema = z
  .object({
    action: z.enum(["approve", "reject"], {
      required_error: "Action must be approve or reject",
    }),
    note: z.string().trim().max(500).optional(),
  })
  .refine(
    (data) =>
      data.action !== "reject" || (data.note && data.note.trim().length >= 5),
    {
      message: "Please provide a rejection reason (at least 5 characters)",
      path: ["note"],
    }
  );

export const assignStaffSchema = z.object({
  staffId: z
    .string({ required_error: "Staff member ID is required" })
    .trim()
    .min(1, "Staff member ID is required"),
  note: z.string().trim().max(500).optional(),
});

export const updatePrioritySchema = z.object({
  priority: z.enum(COMPLAINT_PRIORITIES, {
    required_error: "Please select a valid priority",
  }),
});

export const createStaffSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(72),
  department: z.string().trim().max(80).optional(),
});

export const updateStaffSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    department: z.string().trim().max(80).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.department !== undefined ||
      data.isActive !== undefined,
    { message: "At least one field must be provided to update" }
  );
