import { Hono } from "hono";
import { HonoEnv } from "../types";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../password";
import {
  User,
  UserCredentials,
  validateUser,
  validateUserCredentials,
} from "@lang-track/shared";
import { sign } from "hono/jwt";

const authRouter = new Hono<HonoEnv>();

authRouter.use("/register", async (c, next) => {
  if (c.env.ALLOW_REGISTRATION && c.env.ALLOW_REGISTRATION === "true") {
    return next();
  } else {
    return c.json(null, 403);
  }
});

authRouter.post(
  "/register",
  zValidator(
    "json",
    z.object({
      email: z.string().trim().toLowerCase().email({
        message: "Invalid email address format.",
      }),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long.")
        .max(100, "Password cannot exceed 100 characters.")
        .regex(/[0-9]/, "Password must contain at least one number.")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter."),
    }),
  ),
  async (c) => {
    const { email, password } = c.req.valid("json");

    // ------------------
    // Find existing user
    // ------------------

    const exists = await c.env.DB.prepare("SELECT * from users WHERE email = ?")
      .bind(email)
      .first();
    if (!!exists) {
      return c.json(
        {
          success: false,
          error: {
            name: "Bad Request",
          },
        },
        400,
      );
    }

    // ------------------
    // Create User
    // ------------------

    const now = new Date().toISOString();

    const insertQuery = `
      INSERT INTO users(email, created_at, updated_at)
      VALUES (?, ?, ?)
      RETURNING id
    `;
    const { id } = await c.env.DB.prepare(insertQuery)
      .bind(email, now, now)
      .first<{ id: number }>();

    // ------------------
    // Create User Credentials
    // ------------------

    const passwordHash = await hashPassword(password);
    const credsQuery = `
      INSERT INTO user_credentials(user_id, password_hash, updated_at)
      VALUES(?, ?, ?)
    `;
    const { success, error } = await c.env.DB.prepare(credsQuery)
      .bind(id, passwordHash, now)
      .run();
    if (!success) {
      console.error("insert user_credentials error", error);
      return c.json(
        {
          success: false,
          error: {
            name: "Internal Server Error",
          },
        },
        500,
      );
    }

    const user: User = {
      id,
      email,
      createdAt: now,
      updatedAt: now,
    };

    return c.json({
      success: true,
      user,
    });
  },
);

authRouter.post(
  "/login",
  zValidator(
    "json",
    z.object({
      email: z.string().trim().toLowerCase().email({
        message: "Invalid email address format.",
      }),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long.")
        .max(100, "Password cannot exceed 100 characters."),
    }),
  ),
  async (c) => {
    const { email, password } = c.req.valid("json");

    // ------------------
    // Get the user by email
    // ------------------

    const userResult = await c.env.DB.prepare(
      "SELECT * from users WHERE email = ?",
    )
      .bind(email)
      .first();
    if (!userResult) {
      console.log("user not found");
      return c.json(
        {
          success: false,
          error: {
            name: "Unauthorized",
          },
        },
        401,
      );
    }

    let user: User;
    try {
      user = validateUser({
        id: userResult.id,
        email: userResult.email,
        createdAt: userResult.created_at,
        updatedAt: userResult.updated_at,
      });
    } catch (err) {
      console.log("user validate failed");
      return c.json(
        {
          success: false,
          error: {
            name: "Unauthorized",
          },
        },
        401,
      );
    }

    // ------------------
    // Get the user credentials
    // ------------------

    const userCredentialResults = await c.env.DB.prepare(
      "SELECT * from user_credentials WHERE user_id = ?",
    )
      .bind(user.id)
      .first();
    if (!userCredentialResults) {
      console.log("user credentials not found");
      return c.json(
        {
          success: false,
          error: {
            name: "Unauthorized",
          },
        },
        401,
      );
    }

    let userCredentials: UserCredentials;
    try {
      userCredentials = validateUserCredentials({
        userId: userCredentialResults.user_id,
        passwordHash: userCredentialResults.password_hash,
        updatedAt: userCredentialResults.updated_at,
      });
    } catch (err) {
      return c.json(
        {
          success: false,
          error: {
            name: "Unauthorized",
          },
        },
        401,
      );
    }

    // ------------------
    // Check the password
    // ------------------

    const verified = await verifyPassword(
      userCredentials.passwordHash,
      password,
    );
    if (!verified) {
      console.log("user credentials validation failed");
      return c.json(
        {
          success: false,
          error: {
            name: "Unauthorized",
          },
        },
        401,
      );
    }

    // ------------------
    // Generate the token
    // ------------------

    const token = await sign(
      {
        sub: String(user.id),
        email: user.email,
        // Expires: Now + 2h
        exp: Math.floor(Date.now() / 1000) + 2 * (60 * 60),
      },
      c.env.JWT_SECRET,
    );

    return c.json({
      success: true,
      token,
    });
  },
);

export { authRouter };
