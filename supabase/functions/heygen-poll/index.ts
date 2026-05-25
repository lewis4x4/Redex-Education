import { createHeyGenPollHandler } from "./handler.ts";

Deno.serve(createHeyGenPollHandler({
  getEnv: (name) => Deno.env.get(name),
}));
