import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export interface AssignmentsEntryCardProps {
  onStart: () => void
  isDisabled: boolean
}

const ASSIGNMENTS_DISABLED_TITLE = 'Assignments open in this slice'

export function AssignmentsEntryCard({ onStart, isDisabled }: AssignmentsEntryCardProps) {
  return (
    <Card className="rounded-2xl border border-redex-red/20 bg-redex-red/[0.04] p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[2px] text-redex-red">Assignments</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Assign training to your team</h3>
        </div>
        {isDisabled ? (
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
            Coming soon
          </span>
        ) : null}
      </div>

      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
        Send published modules to individual learners or groups. Set a due date and track completion from the Assignments page.
      </p>

      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700 marker:text-redex-red" aria-label="Assignment workflow steps">
        <li>Select a published module</li>
        <li>Choose a learner or audience group</li>
        <li>Set a due date and confirm</li>
      </ul>

      <Button
        type="button"
        onClick={onStart}
        disabled={isDisabled}
        title={isDisabled ? ASSIGNMENTS_DISABLED_TITLE : undefined}
        variant="brand"
        className="mt-6 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
      >
        Open assignments →
      </Button>
    </Card>
  )
}
