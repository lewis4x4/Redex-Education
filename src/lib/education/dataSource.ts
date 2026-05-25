export type DataSource = 'mock' | 'supabase'

export function getDataSource(): DataSource {
  const mode = import.meta.env.VITE_DATA_SOURCE

  if (mode === 'supabase') {
    return 'supabase'
  }

  if (!mode || mode === 'mock') {
    return 'mock'
  }

  throw new Error(
    `[data-source] Unsupported VITE_DATA_SOURCE value "${mode}". Expected "mock" or "supabase".`,
  )
}
