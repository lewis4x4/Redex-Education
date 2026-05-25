import { useLocation } from 'react-router-dom'

import type { FoundryDraftStage } from '@/lib/education'
import { isFoundryTopicEntryEnabled } from '@/features/foundry/lib/featureFlags'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'

type StepStatus = 'current' | 'completed' | 'upcoming' | 'failed'

type StepDefinition = {
  key: FoundryDraftStage
  label: string
}

const BASE_STEPS: StepDefinition[] = [
  { key: 'basics', label: 'Basics' },
  { key: 'source', label: 'Source' },
  { key: 'questions', label: 'Questions' },
  { key: 'outline', label: 'Outline' },
  { key: 'preview', label: 'Preview' },
  { key: 'critique', label: 'Critique' },
  { key: 'sidebyside', label: 'Side-by-side' },
  { key: 'published', label: 'Publish' },
]

const ROUTE_TO_STAGE: Record<string, FoundryDraftStage> = {
  '/admin/foundry/topic': 'topic',
  '/admin/foundry/start': 'basics',
  '/admin/foundry/source': 'source',
  '/admin/foundry/library': 'source',
  '/admin/foundry/questions': 'questions',
  '/admin/foundry/outline': 'outline',
  '/admin/foundry/preview': 'preview',
  '/admin/foundry/critique': 'critique',
  '/admin/foundry/sidebyside': 'sidebyside',
  '/admin/foundry/blockers': 'sidebyside',
  '/admin/foundry/published': 'published',
}

function stageFromRoute(pathname: string): FoundryDraftStage {
  return ROUTE_TO_STAGE[pathname] ?? 'basics'
}

function statusForStep(
  steps: StepDefinition[],
  step: StepDefinition,
  currentStage: FoundryDraftStage,
  hasPublishBlockers: boolean,
): StepStatus {
  const currentIndex = steps.findIndex((item) => item.key === currentStage)
  const stepIndex = steps.findIndex((item) => item.key === step.key)

  if (step.key === 'published' && currentStage === 'published' && hasPublishBlockers) {
    return 'failed'
  }

  if (stepIndex < currentIndex) {
    return 'completed'
  }

  if (stepIndex === currentIndex) {
    return 'current'
  }

  return 'upcoming'
}

const STATUS_STYLES: Record<StepStatus, string> = {
  current: 'border-redex-red bg-redex-red text-white',
  completed: 'border-slate-900 bg-slate-900 text-white',
  upcoming: 'border-slate-300 bg-white text-slate-500',
  failed: 'border-red-300 bg-red-50 text-red-700',
}

export function FoundryStepper() {
  const location = useLocation()
  const metadataStage = useFoundryDraftStore(
    (state) =>
      (state as unknown as { draft_metadata?: { current_stage?: FoundryDraftStage } }).draft_metadata?.current_stage,
  )
  const getPublishBlockers = useFoundryDraftStore((state) => state.getPublishBlockers)

  const routeStage = stageFromRoute(location.pathname)
  const steps = isFoundryTopicEntryEnabled() ? [{ key: 'topic' as const, label: 'Packet' }, ...BASE_STEPS] : BASE_STEPS
  const currentStage = metadataStage === 'topic' && !isFoundryTopicEntryEnabled() ? routeStage : metadataStage ?? routeStage
  const hasPublishBlockers = getPublishBlockers().length > 0

  return (
    <nav aria-label="Foundry progress" role="navigation" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <ol className="flex flex-wrap items-center gap-3">
        {steps.map((step) => {
          const status = statusForStep(steps, step, currentStage, hasPublishBlockers)
          const isCurrent = status === 'current'

          return (
            <li key={step.key} className="flex items-center gap-2">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${STATUS_STYLES[status]}`}
                aria-hidden="true"
              >
                {step.key === 'published' && status === 'failed' ? '!' : '•'}
              </span>
              <span className="text-sm font-medium text-slate-700" aria-current={isCurrent ? 'step' : undefined}>
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
