import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const smokeSqlPath = path.join(root, 'supabase/tests/rls_smoke.sql');

async function main() {
  try {
    await access(smokeSqlPath);
  } catch {
    console.error(`[rls-smoke] Missing required file: ${smokeSqlPath}`);
    process.exit(1);
  }

  const sql = await readFile(smokeSqlPath, 'utf8');
  const requiredMarkers = [
    'authenticated can directly mutate redex.generation_jobs',
    'redex.current_role() is not profile-first',
    'module_source_bindings.module_version_id',
    'module-version-scoped source binding uniqueness index',
    'authenticated can execute replace_module_source_bindings',
    'service_role',
  ];

  const missing = requiredMarkers.filter((marker) => !sql.toLowerCase().includes(marker.toLowerCase()));

  if (missing.length > 0) {
    console.error('[rls-smoke] SQL scaffold is missing required governance markers:');
    for (const marker of missing) {
      console.error(`  - ${marker}`);
    }
    process.exit(1);
  }

  console.log('[rls-smoke] Linked-project SQL smoke file present and governance assertions found.');
  console.log('[rls-smoke] CI does not execute live RLS assertions; linked-project output remains a manual release gate.');
  console.log('[rls-smoke] Run against a linked Supabase project after migrations are applied:');
  console.log('  supabase db query --linked --file supabase/tests/rls_smoke.sql');
}

main().catch((error) => {
  console.error('[rls-smoke] Unexpected failure:', error);
  process.exit(1);
});
