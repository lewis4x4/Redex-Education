import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FoundryStepper } from '@/features/foundry/components/FoundryStepper'
import { QuestionWizard } from '@/features/foundry/components/QuestionWizard'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'
import type { SetupAnswersInput } from '@/features/foundry/schemas/foundrySchemas'

export function FoundryQuestionsPage() {
  const navigate = useNavigate()
  const currentDraft = useFoundryDraftStore((state) => state.currentDraft)
  const sourceMaterial = useFoundryDraftStore((state) => state.sourceMaterial)
  const setupAnswers = useFoundryDraftStore((state) => state.setupAnswers)

  useEffect(() => {
    // Builder-I hook pending: replace this inline prerequisite redirect with useDraftRedirect('source').
    if (currentDraft === null || sourceMaterial === null) {
      navigate('/admin/foundry/source', { replace: true })
    }
  }, [currentDraft, sourceMaterial, navigate])

  const handleSubmit = (values: SetupAnswersInput) => {
    useFoundryDraftStore.getState().setSetupAnswers(values)
    toast.success('Saved to your draft')
    navigate('/admin/foundry/outline')
  }

  return (
    <section className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Generation guidance</h1>
        <p className="text-[15px] text-slate-600 leading-[1.45]">These answers refine how the Foundry generates this module.</p>
      </header>

      <FoundryStepper />

      <QuestionWizard
        initialValues={useFoundryDraftStore.getState().setupAnswers ?? undefined}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/admin/foundry/source')}
      />

      {setupAnswers !== null ? (
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] text-slate-600 leading-[1.45]">Saved to your draft</p>
            <Button variant="brand" onClick={() => navigate('/admin/foundry/outline')}>
              Continue → Outline review
            </Button>
          </div>
        </Card>
      ) : (
        <p className="flex items-center gap-2 text-xs text-slate-500">Auto-saves as you continue</p>
      )}
    </section>
  )
}
