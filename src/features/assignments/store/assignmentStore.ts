import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { useAuditLogStore } from '@/features/audit/store/auditLogStore'
import { usePublishedModulesStore } from '@/features/publishing/store/publishedModulesStore'
import { getDataSource } from '@/lib/education/dataSource'
import { MOCK_ASSIGNMENTS } from '@/lib/education/mockAssignments'
import { MOCK_ORG_PEOPLE } from '@/lib/education/mockOrgPeople'
import { toWriteError, type WriteError } from '@/lib/education/writeErrors'
import type { Assignment } from '@/types/training'

export interface CreateAssignmentInput {
  module_version_id: Assignment['module_version_id']
  assignee_user_id?: Assignment['assignee_user_id']
  assignee_role?: Assignment['assignee_role']
  due_at?: Assignment['due_at']
  assigned_by: Assignment['assigned_by']
}

interface AssignmentState {
  assignments: Assignment[]
  lastWriteError: WriteError | null
  clearLastWriteError: () => void
  createAssignment: (input: CreateAssignmentInput) => Assignment
  updateAssignmentStatus: (id: Assignment['id'], status: Assignment['status']) => void
  getAssignmentsForUser: (userId: string) => Assignment[]
  getAssignmentsForModule: (moduleVersionId: string) => Assignment[]
  resetAssignments: () => void
}

function cloneSeedAssignments(): Assignment[] {
  return MOCK_ASSIGNMENTS.map((assignment) => ({ ...assignment }))
}

function createMemoryStorage(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
  }
}

function getAssignmentStorage(): Storage {
  if (
    typeof localStorage !== 'undefined' &&
    typeof localStorage.getItem === 'function' &&
    typeof localStorage.setItem === 'function' &&
    typeof localStorage.removeItem === 'function'
  ) {
    return localStorage
  }

  return createMemoryStorage()
}

function createAssignmentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `assignment-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getModuleLabel(moduleVersionId: string): string {
  return (
    usePublishedModulesStore.getState().publishedModules.find((module) => module.module_version_id === moduleVersionId)?.title ??
    moduleVersionId
  )
}

function getActorName(userId?: string): string {
  return MOCK_ORG_PEOPLE.find((person) => person.id === userId)?.display_name ?? userId ?? 'Unassigned learner'
}

function getAssignmentEntityLabel(assignment: Assignment, verb: 'assigned' | 'completed'): string {
  const assigneeLabel = assignment.assignee_user_id
    ? getActorName(assignment.assignee_user_id)
    : assignment.assignee_role
      ? `All ${assignment.assignee_role}s`
      : 'Unassigned learner'

  return `${assigneeLabel} ${verb} ${getModuleLabel(assignment.module_version_id)}`
}

function shouldPersistToSupabase(): boolean {
  return getDataSource() === 'supabase'
}

export const useAssignmentStore = create<AssignmentState>()(
  persist(
    (set, get) => ({
      assignments: cloneSeedAssignments(),
      lastWriteError: null,
      clearLastWriteError: () => set({ lastWriteError: null }),
      createAssignment: (input) => {
        if (!usePublishedModulesStore.getState().isAssignable(input.module_version_id)) {
          throw new Error(`Cannot assign unpublished module version: ${input.module_version_id}`)
        }

        const assignment: Assignment = {
          id: createAssignmentId(),
          module_version_id: input.module_version_id,
          assigned_by: input.assigned_by,
          assigned_at: new Date().toISOString(),
          status: 'pending',
          ...(input.assignee_user_id ? { assignee_user_id: input.assignee_user_id } : {}),
          ...(input.assignee_role ? { assignee_role: input.assignee_role } : {}),
          ...(input.due_at ? { due_at: input.due_at } : {}),
        }

        set((state) => ({ assignments: [...state.assignments, assignment] }))

        if (shouldPersistToSupabase()) {
          void import('@/integrations/supabase/mutations')
            .then(({ insertAssignment }) => insertAssignment({ ...input, id: assignment.id }))
            .then(() => set({ lastWriteError: null }))
            .catch((error: unknown) => set({ lastWriteError: toWriteError('createAssignment', error) }))
        }

        useAuditLogStore.getState().recordEvent({
          event_type: 'assignment_created',
          actor_user_id: input.assigned_by,
          actor_name: getActorName(input.assigned_by),
          entity_type: 'assignment',
          entity_id: assignment.id,
          entity_label: getAssignmentEntityLabel(assignment, 'assigned'),
          metadata: { module_version_id: assignment.module_version_id },
        })
        return assignment
      },
      updateAssignmentStatus: (id, status) => {
        const existing = get().assignments.find((assignment) => assignment.id === id)
        const shouldRecordCompletion = existing !== undefined && existing.status !== 'completed' && status === 'completed'

        set((state) => ({
          assignments: state.assignments.map((assignment) =>
            assignment.id === id ? { ...assignment, status } : assignment,
          ),
        }))

        if (shouldPersistToSupabase()) {
          void import('@/integrations/supabase/mutations')
            .then(({ updateAssignmentStatus }) => updateAssignmentStatus({ id, status }))
            .then((persisted) =>
              set((state) => ({
                assignments: state.assignments.map((assignment) =>
                  assignment.id === id ? { ...assignment, ...persisted } : assignment,
                ),
                lastWriteError: null,
              })),
            )
            .catch((error: unknown) => set({ lastWriteError: toWriteError('updateAssignmentStatus', error) }))
        }

        if (existing && shouldRecordCompletion) {
          const actorUserId = existing.assignee_user_id ?? 'system'
          useAuditLogStore.getState().recordEvent({
            event_type: 'employee_completed_module',
            actor_user_id: actorUserId,
            actor_name: existing.assignee_user_id ? getActorName(existing.assignee_user_id) : 'System',
            entity_type: 'assignment',
            entity_id: existing.id,
            entity_label: getAssignmentEntityLabel(existing, 'completed'),
            metadata: { module_version_id: existing.module_version_id },
          })
        }
      },
      getAssignmentsForUser: (userId) =>
        get().assignments.filter((assignment) => assignment.assignee_user_id === userId),
      getAssignmentsForModule: (moduleVersionId) =>
        get().assignments.filter((assignment) => assignment.module_version_id === moduleVersionId),
      resetAssignments: () => set({ assignments: cloneSeedAssignments(), lastWriteError: null }),
    }),
    {
      name: 'redex-assignments-v1',
      storage: createJSONStorage(() => getAssignmentStorage()),
    },
  ),
)
