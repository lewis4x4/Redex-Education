import { AlertTriangle, CheckCircle2, ExternalLink, FileText, Loader2, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getCourseFoundryAiClient, mockAiClient } from '@/features/foundry/ai'
import type { BrainstormedPacket } from '@/features/foundry/ai/courseFoundryAiClient'
import { fetchModuleIntakeStatus, submitModuleIntakeProposal } from '@/features/foundry/ai/moduleIntakeClient'
import { FoundryStepper } from '@/features/foundry/components/FoundryStepper'
import { isFoundryTopicEntryEnabled, isModuleIntakeBackendEnabled } from '@/features/foundry/lib/featureFlags'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'
import { useActorInfo } from '@/hooks/useActorInfo'
import type { CanonicalAudience } from '@/lib/education'

const AUDIENCE_OPTIONS: Array<{ value: CanonicalAudience; label: string }> = [
  { value: 'field_team', label: 'Field team' },
  { value: 'new_hire', label: 'New hires' },
  { value: 'operations', label: 'Operations' },
  { value: 'managers', label: 'Managers' },
]

function intakeLabel(status: string): string {
  switch (status) {
    case 'queued':
      return 'Queued'
    case 'uploading_to_drive':
      return 'Uploading'
    case 'drive_uploaded':
      return 'Drive uploaded'
    case 'registering':
      return 'Registering'
    case 'registered':
      return 'Registered'
    case 'upload_failed':
    case 'registration_failed':
    case 'sync_failed':
      return 'Failed'
    default:
      return status
  }
}

function driveFileLink(id: string): string {
  return `https://drive.google.com/file/d/${id}/view`
}

function driveFolderLink(id: string): string {
  return `https://drive.google.com/drive/folders/${id}`
}

export function TopicEntryPage() {
  const navigate = useNavigate()
  const actor = useActorInfo()
  const intakeBackendEnabled = isModuleIntakeBackendEnabled()
  const shouldSubmitIntake = intakeBackendEnabled
  const storedPacketDraft = useFoundryDraftStore((state) => state.packetDraft)
  const setPacketDraft = useFoundryDraftStore((state) => state.setPacketDraft)
  const [topic, setTopic] = useState(storedPacketDraft?.topic ?? '')
  const [audienceHint, setAudienceHint] = useState<CanonicalAudience>('field_team')
  const [packet, setPacket] = useState<BrainstormedPacket | null>(storedPacketDraft?.packet ?? null)
  const [error, setError] = useState<string | null>(storedPacketDraft?.last_error_message ?? null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmittingIntake, setIsSubmittingIntake] = useState(false)

  const intakeStatus = storedPacketDraft?.intake_status

  useEffect(() => {
    if (!shouldSubmitIntake || !intakeStatus?.proposal_id || !intakeStatus?.job_id) {
      return
    }

    if (!['queued', 'uploading_to_drive', 'drive_uploaded', 'registering'].includes(intakeStatus.status)) {
      return
    }

    let cancelled = false
    const poll = window.setInterval(() => {
      void fetchModuleIntakeStatus(intakeStatus.proposal_id, intakeStatus.job_id)
        .then((status) => {
          if (cancelled) {
            return
          }

          useFoundryDraftStore.getState().setPacketDraft({
            topic: storedPacketDraft?.topic ?? packet?.suggested_module_title ?? '',
            status: 'accepted',
            packet: storedPacketDraft?.packet ?? packet ?? undefined,
            intake_status: {
              status: status.status,
              proposal_id: status.proposalId,
              job_id: status.jobId,
              proposal_status: status.proposalStatus,
              job_status: status.jobStatus,
              last_error_message: status.lastErrorMessage,
              drive_folder_id: status.driveFolderId,
              library_drive_folder_id: status.libraryDriveFolderId,
              module_drive_folder_id: status.moduleDriveFolderId,
              manifest_drive_file_id: status.manifestDriveFileId,
              files: status.resultFiles,
            },
          })

          if (status.status === 'registered') {
            toast.success('Packet registered in Drive + Source Library.')
            window.clearInterval(poll)
          }

          if (['upload_failed', 'registration_failed', 'sync_failed'].includes(status.status)) {
            toast.error(status.lastErrorMessage || 'Packet intake failed.')
            window.clearInterval(poll)
          }
        })
        .catch(() => {
          // Keep polling; transient status reads should not interrupt UX.
        })
    }, 2_000)

    return () => {
      cancelled = true
      window.clearInterval(poll)
    }
  }, [intakeStatus?.job_id, intakeStatus?.proposal_id, intakeStatus?.status, packet, shouldSubmitIntake, storedPacketDraft?.packet, storedPacketDraft?.topic])

  if (!isFoundryTopicEntryEnabled()) {
    return (
      <section className="mx-auto max-w-3xl space-y-6">
        <Card className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-amber-950">Packet intake is feature-flagged</h1>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Set <code>VITE_FOUNDRY_TOPIC_ENTRY=true</code> to use the mock topic-to-packet shell. Drive upload and Supabase registration are intentionally deferred.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/admin/foundry/start')}>
            Continue with manual basics
          </Button>
        </Card>
      </section>
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedTopic = topic.trim()

    if (trimmedTopic.length < 4) {
      setError('Enter a module topic with at least 4 characters.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setPacketDraft({ topic: trimmedTopic, status: 'drafting' })

    try {
      const packetDraftClient = intakeBackendEnabled ? mockAiClient : getCourseFoundryAiClient()
      const nextPacket = await packetDraftClient.brainstormSourcePacket({ topic: trimmedTopic, audience_hint: audienceHint })
      setPacket(nextPacket)
      setPacketDraft({ topic: trimmedTopic, status: 'reviewing', packet: nextPacket })
      toast.success('Packet proposal drafted')
    } catch (generationError) {
      const message = generationError instanceof Error ? generationError.message : 'Unable to draft a packet right now.'
      setError(message)
      setPacketDraft({ topic: trimmedTopic, status: 'failed', last_error_message: message })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAcceptPacket = async () => {
    if (!packet || isSubmittingIntake) {
      return
    }

    const store = useFoundryDraftStore.getState()
    store.setBasics(packet.module_basics, actor)

    if (shouldSubmitIntake) {
      try {
        setIsSubmittingIntake(true)
        const submitted = await submitModuleIntakeProposal(packet, audienceHint)

        store.setPacketDraft({
          topic: packet.suggested_module_title,
          status: 'accepted',
          packet,
          intake_status: {
            status: submitted.status,
            proposal_id: submitted.proposalId,
            job_id: submitted.jobId,
            proposal_status: submitted.proposalStatus,
            job_status: submitted.jobStatus,
          },
        })
        toast.success('Packet queued for Drive intake. Continue with manual basics review.')
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : 'Unable to submit packet intake proposal.'
        store.setPacketDraft({
          topic: packet.suggested_module_title,
          status: 'accepted',
          packet,
          intake_status: {
            status: 'upload_failed',
            proposal_id: intakeStatus?.proposal_id ?? 'pending',
            job_id: intakeStatus?.job_id ?? 'pending',
            proposal_status: 'upload_failed',
            job_status: 'failed',
            last_error_message: message,
          },
          last_error_message: message,
        })
        toast.error(message)
      } finally {
        setIsSubmittingIntake(false)
      }
    } else {
      store.setPacketDraft({ topic: packet.suggested_module_title, status: 'accepted', packet })
      toast.success('Packet accepted. Review basics before adding source or generating an outline.')
    }

    navigate('/admin/foundry/start')
  }

  const handleDiscardPacket = () => {
    setPacket(null)
    setPacketDraft(null)
    toast.message('Packet proposal discarded')
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 md:space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY · OPTION B</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">New module packet</h1>
        <p className="max-w-3xl text-[15px] leading-[1.45] text-slate-600">
          Draft a proposal packet from a topic, review the files, then seed the existing Foundry flow. When intake backend is enabled, accepting the packet queues Drive upload and Source Library registration without starting lesson generation.
        </p>
      </header>

      <FoundryStepper />

      <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end" onSubmit={(event) => void handleSubmit(event)}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">Module topic</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-redex-red focus:ring-2 focus:ring-redex-red/20"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Cat 6 Training Module"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">Audience</span>
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-redex-red focus:ring-2 focus:ring-redex-red/20"
              value={audienceHint}
              onChange={(event) => setAudienceHint(event.target.value as CanonicalAudience)}
            >
              {AUDIENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="brand" disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {isGenerating ? 'Drafting…' : 'Draft packet'}
          </Button>
        </form>
        {error ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-red-700" role="alert">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {error}
          </p>
        ) : null}
      </Card>

      {packet ? (
        <div className="space-y-5">
          <Card className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-redex-red" aria-hidden="true" />
              <div>
                <h2 className="text-base font-semibold text-slate-950">Proposal safety guardrail</h2>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Every brainstormed file is locked to <code>authority: context</code> and <code>authority_provenance: brainstormed</code>. The next backend slices will upload and register these files, but they still require SME review before promotion.
                </p>
              </div>
            </div>
          </Card>

          {intakeStatus ? (
            <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">Intake status: {intakeLabel(intakeStatus.status)}</h2>
              <p className="mt-2 text-sm text-slate-600">Proposal ID: <code>{intakeStatus.proposal_id}</code></p>
              <p className="mt-1 text-sm text-slate-600">Job ID: <code>{intakeStatus.job_id}</code></p>
              {(intakeStatus.module_drive_folder_id || intakeStatus.library_drive_folder_id || intakeStatus.manifest_drive_file_id) ? (
                <div className="mt-3 space-y-2 text-sm">
                  {intakeStatus.library_drive_folder_id ? (
                    <a className="flex items-center gap-1 text-redex-red hover:underline" href={driveFolderLink(intakeStatus.library_drive_folder_id)} target="_blank" rel="noreferrer">
                      Library folder <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  ) : null}
                  {intakeStatus.module_drive_folder_id ? (
                    <a className="flex items-center gap-1 text-redex-red hover:underline" href={driveFolderLink(intakeStatus.module_drive_folder_id)} target="_blank" rel="noreferrer">
                      Module folder <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  ) : null}
                  {intakeStatus.manifest_drive_file_id ? (
                    <a className="flex items-center gap-1 text-redex-red hover:underline" href={driveFileLink(intakeStatus.manifest_drive_file_id)} target="_blank" rel="noreferrer">
                      Manifest file <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  ) : null}
                  {intakeStatus.files?.map((file) =>
                    file.drive_file_id ? (
                      <a key={`${file.filename ?? 'file'}-${file.drive_file_id}`} className="flex items-center gap-1 text-redex-red hover:underline" href={driveFileLink(file.drive_file_id)} target="_blank" rel="noreferrer">
                        {file.filename ?? file.drive_file_id} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    ) : null,
                  )}
                </div>
              ) : null}
              {intakeStatus.last_error_message ? (
                <p className="mt-2 text-sm text-red-700" role="alert">{intakeStatus.last_error_message}</p>
              ) : null}
            </Card>
          ) : null}

          <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[2px] text-redex-red">Packet proposal</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">{packet.suggested_module_title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{packet.summary}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Est. AI cost: ${(packet.estimated_cost_cents / 100).toFixed(2)}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Library folder</p>
                <p className="mt-1 font-mono text-sm text-slate-800">_library/operations/{packet.library_topic_slug}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Module folder</p>
                <p className="mt-1 font-mono text-sm text-slate-800">modules/{packet.module_folder_slug}</p>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {packet.documents.map((document) => (
              <Card key={document.filename} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <FileText className="h-5 w-5 text-slate-500" aria-hidden="true" />
                <h3 className="mt-3 text-base font-semibold text-slate-950">{document.title}</h3>
                <p className="mt-1 font-mono text-xs text-slate-500">{document.filename}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">authority: {document.authority}</span>
                  <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800">{document.authority_provenance}</span>
                </div>
                {document.notes_for_admin ? <p className="mt-3 text-sm leading-6 text-slate-600">{document.notes_for_admin}</p> : null}
              </Card>
            ))}
          </div>

          <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Before this becomes real source</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {packet.sme_review_checklist.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {packet.unresolved_questions.length > 0 ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Open questions</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {packet.unresolved_questions.map((question) => <li key={question}>{question}</li>)}
                </ul>
              </div>
            ) : null}
          </Card>

          <footer className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={handleDiscardPacket}>Discard proposal</Button>
            <Button variant="brand" onClick={() => void handleAcceptPacket()} disabled={isSubmittingIntake}>
              {isSubmittingIntake ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Accept into draft → Review basics
            </Button>
          </footer>
        </div>
      ) : null}
    </section>
  )
}
