export type DataSource = 'mock' | 'supabase'

export function getDataSource(): DataSource {
  const mode = import.meta.env.VITE_DATA_SOURCE
  if (mode === 'supabase') return 'supabase'
  return 'mock'
}
