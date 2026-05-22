import { loadEnv } from 'vite';

const root = process.cwd();
const mode = 'production';

const viteEnv = loadEnv(mode, root, '');
const mergedEnv = { ...viteEnv, ...process.env };
const mockAuth = mergedEnv.VITE_MOCK_AUTH;

if (mockAuth === 'true') {
  console.error('[build-guard] Refusing production build: VITE_MOCK_AUTH=true');
  process.exit(1);
}
