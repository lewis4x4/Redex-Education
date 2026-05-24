import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { onboardNewPerson } from '@/integrations/supabase/mutations/onboarding'
import { fetchAuditableModulesForOnboarding } from '@/integrations/supabase/queries/onboarding'
import { fetchAllProfiles } from '@/integrations/supabase/queries/profiles'
import { useProfile } from '@/hooks/useProfile'
import type { Role, UUID, User } from '@/types/training'

const ROLE_OPTIONS: Array<{ label: string; value: Role }> = [
  { label: 'Learner', value: 'learner' },
  { label: 'Manager', value: 'manager' },
  { label: 'Foundry author', value: 'foundry_author' },
  { label: 'Admin', value: 'admin' },
]

function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function OnboardNewPersonPage() {
  const navigate = useNavigate()
  const { profile } = useProfile()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('learner')
  const [department, setDepartment] = useState('')
  const [startDate, setStartDate] = useState(isoToday())
  const [managerId, setManagerId] = useState('')

  const [managers, setManagers] = useState<User[]>([])
  const [modules, setModules] = useState<Array<{ id: UUID; module_title: string; criticality?: string }>>([])
  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<UUID>>(new Set())

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const [allProfiles, publishedModules] = await Promise.all([
        fetchAllProfiles(),
        fetchAuditableModulesForOnboarding('all'),
      ])

      if (cancelled) return

      setManagers(allProfiles.filter((person) => person.role === 'manager' || person.role === 'admin'))
      setModules(publishedModules.map((module) => ({
        id: module.id,
        module_title: module.module_title,
        criticality: module.criticality,
      })))
      setSelectedModuleIds(
        new Set(
          publishedModules
            .filter((module) => module.criticality === 'required' || module.criticality === 'recommended')
            .map((module) => module.id),
        ),
      )
    }

    void load().catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : String(loadError))
    })

    return () => {
      cancelled = true
    }
  }, [])

  const canSubmit = useMemo(() => fullName.trim().length > 0 && email.trim().length > 0 && !submitting, [fullName, email, submitting])

  const toggleModule = (moduleId: UUID) => {
    setSelectedModuleIds((previous) => {
      const next = new Set(previous)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profile) {
      setError('Your profile is still loading. Please try again.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      const result = await onboardNewPerson({
        email,
        display_name: fullName,
        role,
        department: department.trim() || undefined,
        manager_id: managerId || undefined,
        start_date: startDate || undefined,
        auto_assigned_module_version_ids: [...selectedModuleIds],
        assigned_by: profile.id,
        actor_name: profile.display_name,
      })

      navigate(`/admin/people/${result.profile_id}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : String(submitError))
      setSubmitting(false)
    }
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">ONBOARDING</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Onboard a new person</h1>
      </header>

      <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700">Full name
              <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </label>
            <label className="text-sm text-slate-700">Email
              <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="text-sm text-slate-700">Role
              <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={role} onChange={(event) => setRole(event.target.value as Role)}>
                {ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="text-sm text-slate-700">Department
              <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={department} onChange={(event) => setDepartment(event.target.value)} />
            </label>
            <label className="text-sm text-slate-700">Start date
              <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <label className="text-sm text-slate-700">Manager
              <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={managerId} onChange={(event) => setManagerId(event.target.value)}>
                <option value="">No manager</option>
                {managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.display_name}</option>)}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[2px] text-slate-500">Auto-assigned modules</h2>
            <div className="space-y-2">
              {modules.map((module) => (
                <label key={module.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={selectedModuleIds.has(module.id)} onChange={() => toggleModule(module.id)} />
                  <span>{module.module_title}</span>
                  {module.criticality ? <span className="text-xs text-slate-500">({module.criticality})</span> : null}
                </label>
              ))}
            </div>
          </div>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <Button type="submit" variant="brand" disabled={!canSubmit}>
            {submitting ? 'Sending invite…' : 'Send onboarding invite'}
          </Button>
        </form>
      </Card>
    </section>
  )
}
