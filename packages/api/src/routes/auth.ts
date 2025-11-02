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
import {
  createUser,
  createUserCredentials,
  getUserByEmail,
  getUserCredentials,
} from "../user";
import { isOk } from "../result";

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

    const exists = await getUserByEmail(c.env, email);
    if (isOk(exists)) {
      // User already exists
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

    const created = await createUser(c.env, email);
    if (!isOk(created)) {
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

    // ------------------
    // Create User Credentials
    // ------------------
    const { value: user } = created;

    const passwordHash = await hashPassword(password);
    const credentials = await createUserCredentials(
      c.env,
      user.id,
      passwordHash,
    );
    if (!isOk(credentials)) {
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

    const userResult = await getUserByEmail(c.env, email);
    if (!isOk(userResult)) {
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
    const { value: user } = userResult;

    // ------------------
    // Get the user credentials
    // ------------------

    const userCredentialResults = await getUserCredentials(c.env, user.id);
    if (!isOk(userCredentialResults)) {
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
    const { value: userCredentials } = userCredentialResults;

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
