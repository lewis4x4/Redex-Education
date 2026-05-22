import { useCallback, useEffect, useState } from 'react'

import type { SourceFile } from '@/lib/education'

type SourceFilesQueryResult = {
  data: SourceFile[] | null
  error: { message: string } | null
}

type SourceFilesQuery = {
  select: (columns: string) => {
    order: (column: 'topic', options: { ascending: boolean }) => Promise<SourceFilesQueryResult>
  }
}

type SourceFilesClient = {
  from: (table: 'source_files') => SourceFilesQuery
}

type LoadSourceFilesResult = {
  files: SourceFile[]
  error: string | null
}

const hasConfiguredSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

async function loadSourceFiles(): Promise<LoadSourceFilesResult> {
  if (!hasConfiguredSupabase) {
    return { files: [], error: null }
  }

  try {
    const { supabase } = await import('@/integrations/supabase/client')
    const sourceFilesClient = supabase as unknown as SourceFilesClient
    const { data, error } = await sourceFilesClient
      .from('source_files')
      .select('*')
      .order('topic', { ascending: true })

    if (error) {
      return { files: [], error: error.message }
    }

    return { files: data ?? [], error: null }
  } catch (error) {
    return {
      files: [],
      error: error instanceof Error ? error.message : 'Unable to load source files.',
    }
  }
}

export function useSourceLibrary(): {
  files: SourceFile[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [files, setFiles] = useState<SourceFile[]>([])
  const [loading, setLoading] = useState(hasConfiguredSupabase)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const result = await loadSourceFiles()
    setFiles(result.files)
    setError(result.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadInitialFiles() {
      const result = await loadSourceFiles()

      if (!cancelled) {
        setFiles(result.files)
        setError(result.error)
        setLoading(false)
      }
    }

    void loadInitialFiles()

    return () => {
      cancelled = true
    }
  }, [])

  return { files, loading, error, refresh }
}
