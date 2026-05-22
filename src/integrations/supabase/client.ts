// ============================================================
// Supabase Client — env-driven
//
// Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from the
// build-time env (see `.env.example`). The anon key is safe to
// ship in the client bundle; row-level security policies are
// what actually gate access.
//
// In development we fail loudly when env vars are missing, so
// the team can't accidentally run with a broken Supabase config.
// In production builds we still create the client (so static
// pages render) but log a single warning — this gives Phase 2
// the chance to wire AuthGate and decide on real fail-modes.
// ============================================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const message =
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Copy .env.example to .env and fill in real values.';
  if (import.meta.env.DEV) {
    // Fail fast in dev so the developer notices immediately.
    throw new Error(message);
  } else {
    // Don't crash production builds during early scaffolding — warn instead.
    // This will tighten in Phase 7 (security) when real backed routes land.
     
    console.warn(message);
  }
}

// Guard localStorage so the module is importable in SSR / test contexts.
const browserStorage =
  typeof window !== 'undefined' ? window.localStorage : undefined;

export const supabase = createClient<Database>(
  SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY ?? '',
  {
    auth: {
      storage: browserStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
