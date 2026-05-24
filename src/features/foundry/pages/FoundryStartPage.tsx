import { Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { DEMO_ORIENTATION_COURSE } from '@/lib/education'
import { ModuleBasicsForm } from '@/features/foundry/components/ModuleBasicsForm'
import { useDraftRedirect } from '@/features/foundry/hooks/useDraftRedirect'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'
import { useActorInfo } from '@/hooks/useActorInfo'
import type { ModuleBasicsFormValues } from '@/features/foundry/types'

export function FoundryStartPage() {
  const navigate = useNavigate()
  const currentDraft = useFoundryDraftStore((state) => state.currentDraft)
  const actor = useActorInfo()

  useDraftRedirect(null)

  const handleSubmit = (values: ModuleBasicsFormValues) => {
    useFoundryDraftStore.getState().setBasics(values, actor)
    navigate('/admin/foundry/source')
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY · STEP 1</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Module basics</h1>
        <p className="text-[15px] leading-[1.45] text-slate-600">
          Give your module a name and audience. The Foundry will use these to tailor the next steps.
        </p>
      </header>

      <div className="space-y-3">
        <ModuleBasicsForm
          initialValues={currentDraft ?? undefined}
          parentCourseOptions={[
            { id: 'standalone', label: 'Standalone module' },
            { id: DEMO_ORIENTATION_COURSE.id, label: DEMO_ORIENTATION_COURSE.title },
          ]}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin')}
        />
        <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <Save className="h-3.5 w-3.5" aria-hidden="true" />
          Your basics will be saved when you continue
        </p>
      </div>
    </section>
  )
}
