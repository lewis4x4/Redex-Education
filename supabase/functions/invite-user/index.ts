import { createInviteUserHandler } from "./handler.ts";

const handler = createInviteUserHandler({
  getEnv: (name) => Deno.env.get(name),
});

Deno.serve(handler);
