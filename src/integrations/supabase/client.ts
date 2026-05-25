import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const MOCK_AUTH_ENABLED = import.meta.env.VITE_MOCK_AUTH === 'true';

const hasSupabaseEnv = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!hasSupabaseEnv) {
  const message =
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Copy .env.example to .env and fill in real values, or keep VITE_MOCK_AUTH=true for local/mock flows.';

  if (!MOCK_AUTH_ENABLED) {
    throw new Error(message);
  }

  // Mock-auth mode: continue without env but make the configuration gap
  // visible so it isn't accidentally deployed to a real Supabase backend.
  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn(message);
  }
}

// Never pass empty URL/key to Supabase client creation.
// This keeps app startup safe for static/mock-auth builds.
const SAFE_SUPABASE_URL = SUPABASE_URL || 'https://example.invalid';
const SAFE_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY || 'mock-auth-no-supabase-key';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function hasStorageApi(value: unknown): value is StorageLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as StorageLike).getItem === 'function' &&
    typeof (value as StorageLike).setItem === 'function' &&
    typeof (value as StorageLike).removeItem === 'function'
  );
}

function resolveCurrentStorage(): StorageLike | null {
  if (typeof window !== 'undefined' && hasStorageApi(window.localStorage)) {
    return window.localStorage;
  }

  if (hasStorageApi(globalThis.localStorage)) {
    return globalThis.localStorage;
  }

  return null;
}

const authStorage: StorageLike = {
  getItem(key: string) {
    return resolveCurrentStorage()?.getItem(key) ?? null;
  },
  setItem(key: string, value: string) {
    resolveCurrentStorage()?.setItem(key, value);
  },
  removeItem(key: string) {
    resolveCurrentStorage()?.removeItem(key);
  },
};

export const supabase = createClient<Database>(
  SAFE_SUPABASE_URL,
  SAFE_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: authStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    // Redex Education tables live in the `redex` schema (see ADR 017).
    // The shared Supabase project's `public` schema belongs to the
    // installer/Victra system; we never read or write there.
    db: {
      schema: 'redex',
    },
  },
);
