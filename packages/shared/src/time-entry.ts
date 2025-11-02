import { z } from "zod";

export const TimeEntrySchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().nullable(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TimeEntry = z.infer<typeof TimeEntrySchema>;

export function validateTimeEntry(data: Record<string, unknown>): TimeEntry {
  return TimeEntrySchema.parse(data);
}
