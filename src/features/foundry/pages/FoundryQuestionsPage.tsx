import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { QuestionWizard } from '@/features/foundry/components/QuestionWizard'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'
import type { SetupAnswersInput } from '@/features/foundry/schemas/foundrySchemas'

export function FoundryQuestionsPage() {
  const navigate = useNavigate()
  const setupAnswers = useFoundryDraftStore((state) => state.setupAnswers)

  const handleSubmit = (values: SetupAnswersInput) => {
    useFoundryDraftStore.getState().setSetupAnswers(values)
    toast.success('Setup answers saved')
  }

  return (
    <section className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY · STEP 3</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Setup questions</h1>
        <p className="text-[15px] text-slate-600 leading-[1.45]">These answers drive how the Foundry generates this module.</p>
      </header>

      <QuestionWizard
        initialValues={useFoundryDraftStore.getState().setupAnswers ?? undefined}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/admin/foundry/source')}
      />

      {setupAnswers !== null ? (
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] text-slate-600 leading-[1.45]">✓ Answers saved</p>
            <Button variant="brand" onClick={() => navigate('/admin/foundry/outline')}>
              Continue → Outline preview
            </Button>
          </div>
        </Card>
      ) : null}
    </section>
  )
}
