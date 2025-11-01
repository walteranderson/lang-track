import { JwtVariables } from "hono/jwt";

export type HonoEnv = {
  Bindings: Env;
  Variables: JwtVariables;
};
