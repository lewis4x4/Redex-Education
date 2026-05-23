type SupabaseError = { message: string }

export function throwOnMutationError(action: string, error: SupabaseError | null | undefined): void {
  if (error) {
    throw new Error(`Failed to ${action}: ${error.message}`)
  }
}

export function requireMutationData<T>(action: string, data: T | null | undefined): T {
  if (data === null || data === undefined) {
    throw new Error(`Failed to ${action}: Supabase returned no row`)
  }

  return data
}
