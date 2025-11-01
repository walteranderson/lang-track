import { Hono } from "hono";
import { authRouter } from "./routes/auth";
import { HonoEnv } from "./types";
import { jwt } from "hono/jwt";
import { User, validateUser } from "@lang-track/shared";

const app = new Hono<HonoEnv>();

app.route("/auth", authRouter);

app.use("/api/*", async (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
  });
  return jwtMiddleware(c, next);
});

app.get("/api/hello", async (c) => {
  const payload: {
    sub: string;
    email: string;
  } = c.get("jwtPayload");

  const userResult = await c.env.DB.prepare("SELECT * from users WHERE id = ?")
    .bind(payload.sub)
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

  return c.json({
    message: "hello world!!",
    user,
  });
});

export default app;
