/// <reference types="vite/client" />

// ============================================================
// Vite env augmentation
// Declare the exact `VITE_*` variables this app expects so that
// `import.meta.env.VITE_SUPABASE_URL` is strongly typed.
// ============================================================

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_MOCK_AUTH?: 'true' | 'false';
  readonly VITE_DATA_SOURCE?: 'mock' | 'supabase';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
