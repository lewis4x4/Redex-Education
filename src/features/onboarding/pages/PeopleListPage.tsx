import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Card } from '@/components/ui/card'
import { fetchOnboardingCandidates } from '@/integrations/supabase/queries/onboarding'
import type { OnboardingCandidate } from '@/integrations/supabase/queries/onboarding'

function formatDate(value: string | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

export function PeopleListPage() {
  const { id: selectedPersonId } = useParams<{ id?: string }>()
  const [rows, setRows] = useState<OnboardingCandidate[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchOnboardingCandidates()
      .then(setRows)
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : String(loadError)))
  }, [])

  const selectedPerson = useMemo(
    () => (selectedPersonId ? rows.find((row) => row.id === selectedPersonId) : null),
    [rows, selectedPersonId],
  )

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">ONBOARDING</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">People</h1>
        </div>
        <Link to="/admin/onboard" className="inline-flex rounded-md bg-redex-red px-4 py-2 text-sm font-semibold text-white hover:bg-redex-red-hover">
          Onboard new person
        </Link>
      </header>

      {selectedPerson ? (
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Onboarding status</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{selectedPerson.display_name}</p>
          <p className="text-sm text-slate-600">{selectedPerson.onboarding_completion_percent}% complete</p>
        </Card>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Start date</th>
              <th className="px-4 py-3">Onboarding completion %</th>
              <th className="px-4 py-3">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{row.display_name}</td>
                <td className="px-4 py-3 text-slate-700">{row.email}</td>
                <td className="px-4 py-3 text-slate-700">{row.role}</td>
                <td className="px-4 py-3 text-slate-700">{row.department ?? '—'}</td>
                <td className="px-4 py-3 text-slate-700">{formatDate(row.start_date)}</td>
                <td className="px-4 py-3 text-slate-700">{row.onboarding_completion_percent}%</td>
                <td className="px-4 py-3 text-slate-700">{formatDate(row.last_activity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  )
}
