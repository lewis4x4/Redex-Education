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
  readonly VITE_MOCK_AUTH_ROLE?: 'admin' | 'foundry_author' | 'manager' | 'learner';
  readonly VITE_DATA_SOURCE?: 'mock' | 'supabase';
  readonly VITE_AI_MODE?: 'mock' | 'real';
  readonly VITE_FOUNDRY_TOPIC_ENTRY?: 'true' | 'false';
  readonly VITE_MODULE_INTAKE_BACKEND?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
