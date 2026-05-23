import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { MOCK_ASSIGNMENTS } from '@/lib/education/mockAssignments'
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

export const useAssignmentStore = create<AssignmentState>()(
  persist(
    (set, get) => ({
      assignments: cloneSeedAssignments(),
      createAssignment: (input) => {
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
        return assignment
      },
      updateAssignmentStatus: (id, status) =>
        set((state) => ({
          assignments: state.assignments.map((assignment) =>
            assignment.id === id ? { ...assignment, status } : assignment,
          ),
        })),
      getAssignmentsForUser: (userId) =>
        get().assignments.filter((assignment) => assignment.assignee_user_id === userId),
      getAssignmentsForModule: (moduleVersionId) =>
        get().assignments.filter((assignment) => assignment.module_version_id === moduleVersionId),
      resetAssignments: () => set({ assignments: cloneSeedAssignments() }),
    }),
    {
      name: 'redex-assignments-v1',
      storage: createJSONStorage(() => getAssignmentStorage()),
    },
  ),
)
