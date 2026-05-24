import { loadEnv } from 'vite';

const root = process.cwd();
const mode = 'production';

const viteEnv = loadEnv(mode, root, '');
const mergedEnv = { ...viteEnv, ...process.env };
const isProductionBuild = mergedEnv.NODE_ENV === 'production' || mergedEnv.NETLIFY === 'true';

if (!isProductionBuild) {
  process.exit(0);
}

const failures = [];

if (mergedEnv.VITE_MOCK_AUTH === 'true') {
  failures.push('VITE_MOCK_AUTH=true');
}

if (mergedEnv.VITE_DATA_SOURCE !== 'supabase') {
  failures.push(`VITE_DATA_SOURCE=${mergedEnv.VITE_DATA_SOURCE || '<unset>'} (must be supabase)`);
}

if (mergedEnv.VITE_AI_MODE !== 'real') {
  failures.push(`VITE_AI_MODE=${mergedEnv.VITE_AI_MODE || '<unset>'} (must be real)`);
}

if (failures.length > 0) {
  console.error('[build-guard] Refusing production build because mock/demo configuration is active:');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  console.error('[build-guard] Set Netlify production env vars to VITE_MOCK_AUTH=false, VITE_DATA_SOURCE=supabase, and VITE_AI_MODE=real.');
  process.exit(1);
}
