import { Hono } from "hono";
import { authRouter } from "./routes/auth";
import { HonoEnv } from "./types";
import { jwt } from "hono/jwt";

const app = new Hono<HonoEnv>();

app.route("/auth", authRouter);

app.use("/api/*", async (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
  });
  return jwtMiddleware(c, next);
});

export default app;
