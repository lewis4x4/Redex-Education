import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export interface FoundryEntryCardProps {
  /** Optional click handler; the page wires this to navigation when enabled */
  onStart?: () => void
  /** Optional click handler for the automated packet intake shell. */
  onPacketStart?: () => void
  /** When true, button is disabled with a "coming soon" tooltip */
  isDisabled?: boolean
}

const FOUNDRY_DISABLED_TITLE = 'Coming soon — Course Foundry start flow'

export function FoundryEntryCard({ onStart, onPacketStart, isDisabled = false }: FoundryEntryCardProps) {
  return (
    <Card className="flex h-full flex-col rounded-2xl border border-redex-red/20 bg-redex-red/[0.04] p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[2px] text-redex-red">Course Foundry</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Create a new module</h3>
        </div>
        {isDisabled ? (
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
            Coming soon
          </span>
        ) : null}
      </div>

      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
        Turn raw Redex knowledge into approved interactive training through the Course Foundry workflow.
      </p>

      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700 marker:text-redex-red" aria-label="Course Foundry module setup steps">
        <li>Paste source markdown or upload SOPs</li>
        <li>Answer setup questions</li>
        <li>Review and approve AI-generated lessons</li>
      </ul>

      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        {onPacketStart ? (
          <Button
            type="button"
            onClick={onPacketStart}
            disabled={isDisabled}
            title={isDisabled ? FOUNDRY_DISABLED_TITLE : 'Feature-flagged packet intake shell'}
            variant="brand"
            className="disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            Start from topic →
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={onStart}
          disabled={isDisabled}
          title={isDisabled ? FOUNDRY_DISABLED_TITLE : undefined}
          variant={onPacketStart ? 'outline' : 'brand'}
          className="disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          Start new module manually →
        </Button>
      </div>
    </Card>
  )
}
