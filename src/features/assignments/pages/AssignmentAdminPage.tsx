import { Link } from 'react-router-dom'

import { AssignmentForm } from '../components/AssignmentForm'
import { AssignedUsersTable } from '../components/AssignedUsersTable'

export function AssignmentAdminPage() {
  return (
    <section className="space-y-6">
      <Link className="text-sm font-medium text-redex-red hover:text-redex-red-hover" to="/admin">
        ← Back to admin dashboard
      </Link>

      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">ADMIN · ASSIGNMENTS</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Manage assignments</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Assign published Redex training to an individual learner or a mock audience group, then confirm it appears in local assignment state.
        </p>
      </header>

      <section aria-labelledby="assignment-form-heading" className="space-y-3">
        <div>
          <h2 id="assignment-form-heading" className="text-xl font-semibold tracking-tight text-slate-900">
            New assignment
          </h2>
          <p className="mt-1 text-sm text-slate-600">Start with HR Basics and choose Marcus, Ana, Devon, or a new-hire cohort.</p>
        </div>
        <AssignmentForm />
      </section>

      <AssignedUsersTable />
    </section>
  )
}
