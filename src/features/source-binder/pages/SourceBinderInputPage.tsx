import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FoundryStepper } from '@/features/foundry/components/FoundryStepper'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'
import { SourcePastePanel, type SourceType } from '@/features/source-binder/components/SourcePastePanel'
import { SourcePreviewPanel } from '@/features/source-binder/components/SourcePreviewPanel'
import { SourceUploadDropzone } from '@/features/source-binder/components/SourceUploadDropzone'
import { parseMarkdownSections } from '@/features/source-binder/utils/markdownSections'
import { useActorInfo } from '@/hooks/useActorInfo'

export function SourceBinderInputPage() {
  const navigate = useNavigate()
  const currentDraft = useFoundryDraftStore((state) => state.currentDraft)
  const sourceMaterial = useFoundryDraftStore((state) => state.sourceMaterial)
  const setSourceMaterial = useFoundryDraftStore((state) => state.setSourceMaterial)
  const clearSourceMaterial = useFoundryDraftStore((state) => state.clearSourceMaterial)
  const actor = useActorInfo()

  useEffect(() => {
    // Builder-I hook pending: replace this inline prerequisite redirect with useDraftRedirect('basics').
    if (currentDraft === null && sourceMaterial === null) {
      navigate('/admin/foundry/start', { replace: true })
    }
  }, [currentDraft, sourceMaterial, navigate])

  const [sourceId] = useState(() => sourceMaterial?.id ?? `source-${Date.now()}`)
  const [title, setTitle] = useState(sourceMaterial?.title ?? '')
  const [type, setType] = useState<SourceType>(sourceMaterial?.type ?? 'markdown')
  const [rawText, setRawText] = useState(sourceMaterial?.raw_text ?? '')
  const [lastUpload, setLastUpload] = useState<{ filename: string } | null>(null)

  const sections = useMemo(() => parseMarkdownSections(rawText), [rawText])

  const syncMaterial = (nextTitle: string, nextType: SourceType, nextRawText: string) => {
    setSourceMaterial(
      {
        id: sourceId,
        title: nextTitle,
        type: nextType,
        raw_text: nextRawText,
        raw_text_preview: nextRawText.slice(0, 200),
        processing_status: 'processed',
        sections: parseMarkdownSections(nextRawText),
      },
      actor,
    )
  }

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle)
    syncMaterial(nextTitle, type, rawText)
  }

  const handleTypeChange = (nextType: SourceType) => {
    setType(nextType)
    syncMaterial(title, nextType, rawText)
  }

  const handleRawTextChange = (nextRawText: string) => {
    setRawText(nextRawText)
    syncMaterial(title, type, nextRawText)
  }

  const handleClearSource = () => {
    if (!window.confirm('Clear all source material? This cannot be undone.')) {
      return
    }

    clearSourceMaterial()
    setTitle('')
    setType('markdown')
    setRawText('')
    setLastUpload(null)
  }

  const hasOrphanedSourceState = sourceMaterial === null && currentDraft === null

  return (
    <section className="max-w-6xl mx-auto space-y-6 md:space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Source material</h1>
        <p className="text-[15px] text-slate-600 leading-[1.45]">
          Paste markdown, upload an .md file, or pick from the Source Library.
        </p>
      </header>

      <FoundryStepper />

      <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">Source Library</h2>
            <p className="text-[15px] leading-[1.45] text-slate-600">
              Use the library when the source already lives in Drive — Foundry will respect the existing version chain.
            </p>
          </div>
          <Button type="button" onClick={() => navigate('/admin/foundry/library')} aria-label="Browse Source Library" variant="brand">
            Browse Source Library →
          </Button>
        </div>
      </Card>

      {hasOrphanedSourceState ? (
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
          <p className="text-[15px] text-slate-600 leading-[1.45]">
            It looks like you arrived here without starting from basics. Begin with module basics first.
          </p>
          <div>
            <Button type="button" onClick={() => navigate('/admin/foundry/start')}>
              Start from basics →
            </Button>
          </div>
        </Card>
      ) : null}

      <p className="flex items-center gap-2 text-xs text-slate-500">Saved to your draft</p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <SourcePastePanel
            title={title}
            type={type}
            rawText={rawText}
            onTitleChange={handleTitleChange}
            onTypeChange={handleTypeChange}
            onRawTextChange={handleRawTextChange}
          />
          <SourceUploadDropzone
            hasUpload={lastUpload !== null}
            currentFilename={lastUpload?.filename}
            onFileLoaded={({ filename, rawText: loadedRawText }) => {
              setLastUpload({ filename })
              handleRawTextChange(loadedRawText)
            }}
          />
        </div>

        <div className="lg:col-span-5">
          <SourcePreviewPanel sections={sections} />
        </div>
      </div>

      <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="outline" onClick={() => navigate('/admin/foundry/start')}>
          ← Back to basics
        </Button>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <Button type="button" variant="outline" onClick={handleClearSource}>
            Clear source
          </Button>
          <Button type="button" onClick={() => navigate('/admin/foundry/questions')} variant="brand" className="disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed">
            Continue → Setup questions
          </Button>
        </div>
      </footer>
    </section>
  )
}
