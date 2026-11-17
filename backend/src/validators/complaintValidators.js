import { z } from "zod";

export const COMPLAINT_CATEGORIES = [
  "electrical",
  "plumbing",
  "furniture",
  "cleaning",
  "network",
  "equipment",
  "other",
];

export const COMPLAINT_PRIORITIES = ["low", "medium", "high", "urgent"];

const locationSchema = z.object({
  block: z.string().trim().min(1, "Campus block is required").max(80),
  floor: z.string().trim().max(40).optional().default(""),
  room: z.string().trim().max(60).optional().default(""),
  details: z.string().trim().max(200).optional().default(""),
});

export const createComplaintSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(120, "Title cannot exceed 120 characters"),
  description: z
    .string({ required_error: "Description is required" })
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  category: z.enum(COMPLAINT_CATEGORIES, {
    required_error: "Please select a valid category",
  }),
  priority: z.enum(COMPLAINT_PRIORITIES).optional().default("medium"),
  location: locationSchema,
});

export const feedbackSchema = z
  .object({
    action: z.enum(["close", "reopen"]).optional().default("close"),
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().trim().max(500).optional(),
  })
  .refine(
    (data) =>
      data.action === "reopen" ||
      (data.rating !== undefined && data.rating >= 1 && data.rating <= 5),
    {
      message: "Please select a rating between 1 and 5 stars",
      path: ["rating"],
    }
  )
  .refine(
    (data) =>
      data.action !== "reopen" ||
      (data.comment && data.comment.trim().length >= 5),
    {
      message: "Please explain why the issue is being reopened",
      path: ["comment"],
    }
  );
