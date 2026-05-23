import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GeneratedOutlineCard } from '@/features/foundry/components/GeneratedOutlineCard'
import { LessonOutlineList } from '@/features/foundry/components/LessonOutlineList'
import { MissingInfoWarnings } from '@/features/foundry/components/MissingInfoWarnings'
import { getCourseFoundryAiClient, getCourseFoundryLessonSourceBindings } from '@/features/foundry/ai'
import {
  DEFAULT_AI_MODULE_BASICS,
  DEFAULT_AI_SETUP_ANSWERS,
  DEFAULT_AI_SOURCE_MATERIAL,
} from '@/features/foundry/ai/pageInputDefaults'
import { useMockGenerationDelay } from '@/features/foundry/lib/useMockGenerationDelay'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'

const OUTLINE_STATUS_LABELS = {
  draft: 'Draft',
  approved: 'Approved',
  regenerating: 'Regenerating',
} as const

export function OutlineReviewPage() {
  const navigate = useNavigate()
  const outline = useFoundryDraftStore((state) => state.outline)
  const outlineStatus = useFoundryDraftStore((state) => state.outline_status)
  const currentDraft = useFoundryDraftStore((state) => state.currentDraft)
  const sourceMaterial = useFoundryDraftStore((state) => state.sourceMaterial)
  const setupAnswers = useFoundryDraftStore((state) => state.setupAnswers)
  const setOutline = useFoundryDraftStore((state) => state.setOutline)
  const approveOutline = useFoundryDraftStore((state) => state.approveOutline)
  const regenerateOutlineStart = useFoundryDraftStore((state) => state.regenerateOutlineStart)
  const lessonSourceBindings = getCourseFoundryLessonSourceBindings()

  const generateOutline = () =>
    getCourseFoundryAiClient().generateOutline({
      basics: currentDraft ?? DEFAULT_AI_MODULE_BASICS,
      sources: sourceMaterial ?? DEFAULT_AI_SOURCE_MATERIAL,
      setupAnswers: setupAnswers ?? DEFAULT_AI_SETUP_ANSWERS,
    })

  const { isGenerating } = useMockGenerationDelay({
    shouldGenerate: outline === null,
    delayMs: 600,
    populate: () => {
      void generateOutline().then(setOutline)
    },
  })

  const handleRegenerate = async () => {
    regenerateOutlineStart()
    await new Promise((resolve) => window.setTimeout(resolve, 800))
    setOutline(await generateOutline())
    toast.success('Regenerated outline')
  }

  const handleApprove = () => {
    approveOutline()
    toast.success('Outline approved')
  }

  return (
    <section className="max-w-5xl mx-auto space-y-6 md:space-y-8">
      <header className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY · STEP 4</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Review the generated outline</h1>
          <p className="text-[15px] text-slate-600 leading-[1.45]">
            The Foundry has proposed this module structure from your source material. Review, regenerate, or approve.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            to="/admin/foundry/questions"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            ← Back to questions
          </Link>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
            {OUTLINE_STATUS_LABELS[outlineStatus]}
          </span>
        </div>
      </header>

      {isGenerating || outline === null ? (
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600 animate-pulse">Generating outline…</p>
        </Card>
      ) : (
        <>
          <GeneratedOutlineCard outline={outline} />
          <LessonOutlineList modules={outline.modules} sourceBindings={lessonSourceBindings} />
          <MissingInfoWarnings notes={outline.missing_source_notes ?? []} />

          {outlineStatus === 'approved' ? (
            <Card className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[15px] text-emerald-800 leading-[1.45]">✓ Outline approved.</p>
                <Button variant="brand" onClick={() => navigate('/admin/foundry/preview')}>
                  Continue → Module preview
                </Button>
              </div>
            </Card>
          ) : null}

          <footer className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => void handleRegenerate()} disabled={outlineStatus === 'regenerating'}>
              Regenerate
            </Button>
            <Button
              variant="outline"
              disabled
              title="Coming in Slice 3.2 — full module generation preview"
            >
              Edit outline
            </Button>
            <Button variant="brand" onClick={handleApprove}>
              Approve outline
            </Button>
          </footer>
        </>
      )}
    </section>
  )
}
