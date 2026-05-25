import { createHeyGenSubmitHandler } from "./handler.ts";

Deno.serve(createHeyGenSubmitHandler({
  getEnv: (name) => Deno.env.get(name),
}));
