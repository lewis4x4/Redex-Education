import { useCallback, useEffect, useState } from 'react'

import type { PublishedModuleRecord } from '@/features/publishing/store/publishedModulesStore'
import { usePublishedModulesStore } from '@/features/publishing/store/publishedModulesStore'
import { getDataSource } from '@/lib/education/dataSource'
import { MOCK_ASSIGNMENTS } from '@/lib/education/mockAssignments'
import { MOCK_ORG_PEOPLE } from '@/lib/education/mockOrgPeople'
import type { Assignment, User } from '@/types/training'
import { useAssignmentStore, type CreateAssignmentInput } from '../store/assignmentStore'
import type { AssignmentWithNames } from '@/integrations/supabase/queries/assignments'

export interface UseAssignmentAdminResult {
  assignableUsers: User[]
  publishedModules: PublishedModuleRecord[]
  assignments: AssignmentWithNames[]
  loading: boolean
  error: Error | null
  refetch: () => void
  createAssignment: (input: CreateAssignmentInput) => Promise<Assignment>
}

const noop = () => undefined

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause))
}

function withMockNames(assignments: Assignment[]): AssignmentWithNames[] {
  const usersById = new Map(MOCK_ORG_PEOPLE.map((person) => [person.id, person.display_name]))
  return assignments.map((assignment) => ({
    ...assignment,
    assignee_display_name: assignment.assignee_user_id
      ? (usersById.get(assignment.assignee_user_id) ?? undefined)
      : undefined,
    assigned_by_display_name: usersById.get(assignment.assigned_by) ?? undefined,
  }))
}

export function useAssignmentAdmin(): UseAssignmentAdminResult {
  const isSupabase = getDataSource() === 'supabase'

  const storeAssignments = useAssignmentStore((state) => state.assignments)
  const storeCreateAssignment = useAssignmentStore((state) => state.createAssignment)
  const storePublishedModules = usePublishedModulesStore((state) => state.publishedModules)

  const [assignableUsers, setAssignableUsers] = useState<User[]>([])
  const [publishedModules, setPublishedModules] = useState<PublishedModuleRecord[]>([])
  const [assignments, setAssignments] = useState<AssignmentWithNames[]>([])
  const [loading, setLoading] = useState(isSupabase)
  const [error, setError] = useState<Error | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const refetch = useCallback(() => {
    if (!isSupabase) return
    setReloadKey((current) => current + 1)
  }, [isSupabase])

  useEffect(() => {
    if (!isSupabase) {
      return undefined
    }

    let cancelled = false

    queueMicrotask(() => {
      if (cancelled) return
      setLoading(true)
      setError(null)
    })

    void (async () => {
      try {
        const [{ fetchAssignableUsers }, { fetchPublishedModuleAssignments, fetchAllAssignmentsWithNames }] =
          await Promise.all([
            import('@/integrations/supabase/queries/profiles'),
            import('@/integrations/supabase/queries/assignments'),
          ])

        const [nextUsers, nextModules, nextAssignments] = await Promise.all([
          fetchAssignableUsers(),
          fetchPublishedModuleAssignments(),
          fetchAllAssignmentsWithNames(),
        ])

        if (cancelled) return
        setAssignableUsers(nextUsers)
        setPublishedModules(nextModules)
        setAssignments(nextAssignments)
        setLoading(false)
      } catch (cause: unknown) {
        if (cancelled) return
        setError(toError(cause))
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isSupabase, reloadKey])

  const createAssignment = useCallback(
    async (input: CreateAssignmentInput): Promise<Assignment> => {
      if (!isSupabase) {
        const assignment = storeCreateAssignment(input)
        return assignment
      }

      const { createAssignment: persistAssignment } = await import('@/integrations/supabase/mutations/assignments')
      const assignment = await persistAssignment(input)
      refetch()
      return assignment
    },
    [isSupabase, refetch, storeCreateAssignment],
  )

  if (!isSupabase) {
    return {
      assignableUsers: MOCK_ORG_PEOPLE,
      publishedModules: storePublishedModules,
      assignments: withMockNames(storeAssignments.length > 0 ? storeAssignments : MOCK_ASSIGNMENTS),
      loading: false,
      error: null,
      refetch: noop,
      createAssignment,
    }
  }

  return {
    assignableUsers,
    publishedModules,
    assignments,
    loading,
    error,
    refetch,
    createAssignment,
  }
}
