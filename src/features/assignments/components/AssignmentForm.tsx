import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { useAssignmentAdmin } from '../hooks/useAssignmentAdmin'
import { useActorInfo } from '@/hooks/useActorInfo'
import type { Assignment } from '@/types/training'
import { COHORTS } from '../lib/cohorts'

const assignmentFormSchema = z
  .object({
    moduleVersionId: z.string().min(1, 'Select a module'),
    assigneeMode: z.enum(['user', 'cohort']),
    assigneeUserId: z.string().optional(),
    cohortId: z.string().optional(),
    dueAt: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.assigneeMode === 'user' && !values.assigneeUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['assigneeUserId'],
        message: 'Select a learner',
      })
    }

    if (values.assigneeMode === 'cohort' && !values.cohortId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cohortId'],
        message: 'Select an audience group',
      })
    }
  })

export type AssignmentFormValues = z.infer<typeof assignmentFormSchema>

export interface AssignmentFormProps {
  onAssigned?: (assignment: Assignment) => void
}

function getDefaultValues(moduleVersionId = ''): AssignmentFormValues {
  return {
    moduleVersionId,
    assigneeMode: 'user',
    assigneeUserId: '',
    cohortId: '',
    dueAt: '',
  }
}

function toDueAtIso(dateValue?: string): string | undefined {
  if (!dateValue) {
    return undefined
  }

  return new Date(`${dateValue}T17:00:00`).toISOString()
}

function formatDueToast(dateValue?: string): string {
  if (!dateValue) {
    return 'no due date set'
  }

  return `due ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${dateValue}T00:00:00`))}`
}

function getAssigneeLabel(values: AssignmentFormValues, assignableUsers: { id: string; display_name: string }[]): string {
  if (values.assigneeMode === 'cohort') {
    return COHORTS.find((cohort) => cohort.id === values.cohortId)?.label ?? 'selected cohort'
  }

  return assignableUsers.find((user) => user.id === values.assigneeUserId)?.display_name ?? 'selected learner'
}

export function AssignmentForm({ onAssigned }: AssignmentFormProps) {
  const { assignableUsers, publishedModules, createAssignment } = useAssignmentAdmin()
  const actor = useActorInfo()
  const moduleOptions = publishedModules.map((module) => ({
    value: module.module_version_id,
    label: module.title,
  }))
  const firstModuleId = moduleOptions[0]?.value ?? ''
  const hasPublishedModules = moduleOptions.length > 0
  const [assigneeMode, setAssigneeMode] = useState<AssignmentFormValues['assigneeMode']>('user')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: getDefaultValues(firstModuleId),
    mode: 'onSubmit',
  })
  const assigneeModeField = register('assigneeMode')

  const onSubmit = async (values: AssignmentFormValues) => {
    const cohort = COHORTS.find((candidate) => candidate.id === values.cohortId)
    const assignment = await createAssignment({
      module_version_id: values.moduleVersionId,
      assigned_by: actor?.userId ?? 'system',
      due_at: toDueAtIso(values.dueAt),
      ...(values.assigneeMode === 'user' ? { assignee_user_id: values.assigneeUserId } : {}),
      ...(values.assigneeMode === 'cohort' && cohort ? { assignee_role: cohort.role } : {}),
    })

    toast.success(`Assigned to ${getAssigneeLabel(values, assignableUsers)} — ${formatDueToast(values.dueAt)}`)
    onAssigned?.(assignment)
    reset(getDefaultValues(firstModuleId))
    setAssigneeMode('user')
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
      <form aria-label="Create assignment" className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900" htmlFor="moduleVersionId">
            Select module <span aria-hidden="true">*</span>
          </label>
          <select
            id="moduleVersionId"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            aria-invalid={errors.moduleVersionId ? 'true' : 'false'}
            aria-describedby={
              errors.moduleVersionId
                ? 'moduleVersionId-error moduleVersionId-help'
                : 'moduleVersionId-help'
            }
            disabled={!hasPublishedModules}
            {...register('moduleVersionId')}
          >
            {moduleOptions.map((module) => (
              <option key={module.value} value={module.value}>
                {module.label}
              </option>
            ))}
          </select>
          {!hasPublishedModules ? (
            <p id="moduleVersionId-help" className="text-sm text-slate-600">
              No modules are published yet. Publish a module from Foundry to make it assignable.
            </p>
          ) : (
            <p id="moduleVersionId-help" className="sr-only">
              Only published modules can be assigned.
            </p>
          )}
          <p id="moduleVersionId-error" aria-live="polite" className="text-sm text-red-600">
            {errors.moduleVersionId?.message ?? '\u00a0'}
          </p>
        </div>

        <fieldset className="space-y-2" aria-describedby={errors.assigneeMode ? 'assigneeMode-error' : undefined}>
          <legend className="block text-sm font-medium text-slate-900">Assign to</legend>
          <div className="flex flex-wrap gap-5">
            <label className="inline-flex items-center gap-2 text-sm text-slate-900" htmlFor="assigneeMode-user">
              <input
                id="assigneeMode-user"
                type="radio"
                value="user"
                className="h-4 w-4 border-slate-300 text-redex-red focus:ring-redex-red"
                {...assigneeModeField}
                onChange={(event) => {
                  assigneeModeField.onChange(event)
                  setAssigneeMode('user')
                }}
              />
              Individual learner
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-900" htmlFor="assigneeMode-cohort">
              <input
                id="assigneeMode-cohort"
                type="radio"
                value="cohort"
                className="h-4 w-4 border-slate-300 text-redex-red focus:ring-redex-red"
                {...assigneeModeField}
                onChange={(event) => {
                  assigneeModeField.onChange(event)
                  setAssigneeMode('cohort')
                }}
              />
              Audience group
            </label>
          </div>
          <p id="assigneeMode-error" aria-live="polite" className="text-sm text-red-600">
            {errors.assigneeMode?.message ?? '\u00a0'}
          </p>
        </fieldset>

        {assigneeMode === 'user' ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900" htmlFor="assigneeUserId">
              Select user <span aria-hidden="true">*</span>
            </label>
            <select
              id="assigneeUserId"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red"
              aria-invalid={errors.assigneeUserId ? 'true' : 'false'}
              aria-describedby={errors.assigneeUserId ? 'assigneeUserId-error' : undefined}
              {...register('assigneeUserId')}
            >
              <option value="">Select a learner</option>
              {assignableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.display_name}
                </option>
              ))}
            </select>
            <p id="assigneeUserId-error" aria-live="polite" className="text-sm text-red-600">
              {errors.assigneeUserId?.message ?? '\u00a0'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900" htmlFor="cohortId">
              Select audience group <span aria-hidden="true">*</span>
            </label>
            <select
              id="cohortId"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red"
              aria-invalid={errors.cohortId ? 'true' : 'false'}
              aria-describedby={errors.cohortId ? 'cohortId-error cohortId-help' : 'cohortId-help'}
              {...register('cohortId')}
            >
              <option value="">Select a group</option>
              {COHORTS.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.label}
                </option>
              ))}
            </select>
            <p id="cohortId-help" className="text-xs text-slate-500">
              Audience groups assign to every member of the selected role.
            </p>
            <p id="cohortId-error" aria-live="polite" className="text-sm text-red-600">
              {errors.cohortId?.message ?? '\u00a0'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900" htmlFor="dueAt">
            Set due date
          </label>
          <input
            id="dueAt"
            type="date"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red"
            {...register('dueAt')}
          />
          <p className="text-xs text-slate-500">Optional. Leave blank for open-ended onboarding.</p>
        </div>

        <Button type="submit" variant="brand" disabled={isSubmitting || !hasPublishedModules}>
          Assign training
        </Button>
      </form>
    </div>
  )
}
