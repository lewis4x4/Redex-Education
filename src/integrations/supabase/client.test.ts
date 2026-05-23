import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Slice 8.1 — Supabase client env contract.
 *
 * Acceptance criteria (locked here):
 *  1. Client initializes only with env values (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY).
 *  2. Missing env values produce a clear dev error UNLESS VITE_MOCK_AUTH=true.
 *  3. Mock-auth mode warns via console.warn but does not throw.
 *
 * Each test fully isolates module state via vi.resetModules() + vi.stubEnv()
 * because `src/integrations/supabase/client.ts` reads env at module top level.
 */
describe('supabase/client — env contract', () => {
  const originalWarn = console.warn;

  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    console.warn = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    console.warn = originalWarn;
  });

  it('throws a clear error when env vars are missing and mock auth is OFF', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    vi.stubEnv('VITE_MOCK_AUTH', 'false');

    await expect(import('./client')).rejects.toThrow(
      /Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY/,
    );
  });

  it('warns (does not throw) when env vars are missing and mock auth is ON', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    vi.stubEnv('VITE_MOCK_AUTH', 'true');

    const mod = await import('./client');
    expect(mod.supabase).toBeDefined();
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(
      (console.warn as unknown as { mock: { calls: string[][] } }).mock.calls[0]![0]!,
    ).toMatch(/Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY/);
  });

  it('initializes cleanly when both env vars are provided', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');
    vi.stubEnv('VITE_MOCK_AUTH', 'false');

    const mod = await import('./client');
    expect(mod.supabase).toBeDefined();
    // The warn-on-missing path is covered by the previous test; here we only
    // assert that providing env values yields a usable client.
  });
});
