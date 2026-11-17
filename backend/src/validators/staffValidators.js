import { z } from "zod";

export const updateTaskStatusSchema = z.object({
  status: z.enum(["in_progress", "resolved"], {
    required_error: "Status must be in_progress or resolved",
  }),
  note: z.string().trim().max(500).optional(),
  resolutionNote: z.string().trim().max(1000).optional(),
});
