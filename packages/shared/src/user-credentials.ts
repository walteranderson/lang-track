import { z } from "zod";

export const UserCredentialsSchema = z.object({
  userId: z.number().int().positive(),
  passwordHash: z.string().min(60).max(255),
  updatedAt: z.string().datetime(),
});

export type UserCredentials = z.infer<typeof UserCredentialsSchema>;

export function validateUserCredentials(
  data: Record<string, unknown>,
): UserCredentials {
  return UserCredentialsSchema.parse(data);
}
