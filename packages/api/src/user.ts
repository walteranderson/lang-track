import {
  User,
  UserCredentials,
  validateUser,
  validateUserCredentials,
} from "@lang-track/shared";
import { ok, err, Result } from "./result";

export async function getUserByEmail(
  env: Env,
  email: string,
): Promise<Result<User, null>> {
  const query = "SELECT * FROM users WHERE email = ?";
  const { success, results } = await env.DB.prepare(query).bind(email).run();
  if (!success || !results.length) {
    return err(null);
  }

  try {
    const dbUser = results[0];
    const user = validateUser({
      id: dbUser.id,
      email: dbUser.email,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    });
    return ok(user);
  } catch (error) {
    console.error("ERROR validating user in getUserByEmail", error);
    return err(null);
  }
}

export async function getUserById(
  env: Env,
  id: number,
): Promise<Result<User, null>> {
  const query = "SELECT * FROM users WHERE id = ?";
  const { success, results } = await env.DB.prepare(query).bind(id).run();
  if (!success || !results.length) {
    return err(null);
  }

  try {
    const dbUser = results[0];
    const user = validateUser({
      id: dbUser.id,
      email: dbUser.email,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    });
    return ok(user);
  } catch (error) {
    console.error("ERROR validating user in getUserById", error);
    return err(null);
  }
}

export async function createUser(
  env: Env,
  email: string,
): Promise<Result<User, Error>> {
  try {
    const now = new Date().toISOString();
    const insertQuery = `
      INSERT INTO users(email, created_at, updated_at)
      VALUES (?, ?, ?)
      RETURNING id
    `;
    const { id } = await env.DB.prepare(insertQuery)
      .bind(email, now, now)
      .first<{ id: number }>();

    const user = validateUser({
      id,
      email,
      createdAt: now,
      updatedAt: now,
    });
    return ok(user);
  } catch (error) {
    return err(error as Error);
  }
}

export async function createUserCredentials(
  env: Env,
  userId: number,
  passwordHash: string,
): Promise<Result<User, Error>> {
  try {
    const now = new Date().toISOString();
    const credsQuery = `
      INSERT INTO user_credentials(user_id, password_hash, updated_at)
      VALUES(?, ?, ?)
    `;
    const { success, error } = await env.DB.prepare(credsQuery)
      .bind(userId, passwordHash, now)
      .run();
    if (!success) {
      return err(error);
    }
    const user = validateUserCredentials({
      userId,
      passwordHash,
      updatedAt: now,
    });
    return ok(user);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getUserCredentials(
  env: Env,
  userId: number,
): Promise<Result<UserCredentials, Error>> {
  const query = "SELECT * FROM user_credentials WHERE user_id = ?";
  const { success, results } = await env.DB.prepare(query).bind(userId).run();
  if (!success || !results.length) {
    return err(null);
  }

  try {
    const dbCreds = results[0];
    const credentials = validateUserCredentials({
      userId,
      passwordHash: dbCreds.password_hash,
      updatedAt: dbCreds.updated_at,
    });
    return ok(credentials);
  } catch (error) {
    console.error("ERROR validating user in getUserCredentials", error);
    return err(null);
  }
}
