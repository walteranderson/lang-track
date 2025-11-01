import { z } from "zod";

export const UserSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email({ message: "Invalid email address format." }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().nullable(),
});

export type User = z.infer<typeof UserSchema>;

export function validateUser(data: Record<string, unknown>): User {
  return UserSchema.parse(data);
}
