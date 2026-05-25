import { createTranscriptIngestHandler } from "./handler.ts";

Deno.serve(createTranscriptIngestHandler({
  getEnv: (name) => Deno.env.get(name),
}));
