import type { BrainstormedPacket } from './courseFoundryAiClient'

type SupabaseClient = typeof import('@/integrations/supabase/client').supabase

type SupabaseErrorLike = { message?: string }

interface SupabaseTableQueryLike {
  select(columns: string): SupabaseTableQueryLike
  eq(column: string, value: string): SupabaseTableQueryLike
  single<T>(): Promise<{ data: T | null; error: SupabaseErrorLike | null }>
}

interface IntakeStatusProposalRow {
  id: string
  status: IntakeLifecycleStatus
  last_error_message: string | null
  drive_folder_id: string | null
  library_drive_folder_id: string | null
  module_drive_folder_id: string | null
  manifest_drive_file_id: string | null
}

interface IntakeStatusJobRow {
  id: string
  status: string
  result_payload: { files?: Array<{ filename?: string; drive_file_id?: string }> } | null
}

const SUBMIT_INTAKE_FUNCTION = 'submit-module-intake-proposal'

export type IntakeLifecycleStatus =
  | 'queued'
  | 'uploading_to_drive'
  | 'drive_uploaded'
  | 'registering'
  | 'registered'
  | 'upload_failed'
  | 'registration_failed'
  | 'sync_failed'

export interface IntakeSubmitResult {
  status: IntakeLifecycleStatus
  proposalId: string
  jobId: string
  proposalStatus: string
  jobStatus: string
  dedupeKey: string
  reusedJob: boolean
}

export interface IntakeStatusResult {
  status: IntakeLifecycleStatus
  proposalId: string
  jobId: string
  proposalStatus: string
  jobStatus: string
  lastErrorMessage?: string
  driveFolderId?: string
  libraryDriveFolderId?: string
  moduleDriveFolderId?: string
  manifestDriveFileId?: string
  resultFiles?: Array<{ filename?: string; drive_file_id?: string }>
}

interface IntakeSubmitResponse {
  status?: string
  proposal_id?: string
  job_id?: string
  proposal_status?: string
  job_status?: string
  dedupe_key?: string
  reused_job?: boolean
  code?: string
  message?: string
}

function stableJsonStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJsonStringify).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJsonStringify(record[key])}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function fallbackStableHash(value: string): string {
  let hash = 2_166_136_261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

async function packetHash(packet: BrainstormedPacket): Promise<string> {
  const stablePacket = stableJsonStringify(packet)

  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(stablePacket))
    return bytesToHex(digest)
  }

  return fallbackStableHash(stablePacket)
}

async function makeIdempotencyKey(packet: BrainstormedPacket): Promise<string> {
  const hash = await packetHash(packet)
  return `topic-entry:${packet.suggested_module_slug}:${hash}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function getSupabaseClient(): Promise<SupabaseClient> {
  const module = await import('@/integrations/supabase/client')
  return module.supabase
}

function asSubmitResponse(value: unknown): IntakeSubmitResponse {
  return isRecord(value) ? (value as IntakeSubmitResponse) : {}
}

export async function submitModuleIntakeProposal(
  packet: BrainstormedPacket,
  audienceHint?: string,
): Promise<IntakeSubmitResult> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase.functions.invoke(SUBMIT_INTAKE_FUNCTION, {
    body: {
      client_idempotency_key: await makeIdempotencyKey(packet),
      library_topic: packet.suggested_module_title,
      audience_hint: audienceHint,
      packet,
    },
  })

  if (error) {
    throw new Error(error.message || 'Module intake submission failed.')
  }

  const payload = asSubmitResponse(data)

  if (!payload.proposal_id || !payload.job_id) {
    throw new Error(payload.message || 'Module intake submission returned an unexpected response.')
  }

  if (payload.status === 'error') {
    throw new Error(payload.message || 'Module intake submission failed.')
  }

  return {
    status: (payload.proposal_status as IntakeLifecycleStatus) ?? 'queued',
    proposalId: payload.proposal_id,
    jobId: payload.job_id,
    proposalStatus: payload.proposal_status ?? 'queued',
    jobStatus: payload.job_status ?? 'queued',
    dedupeKey: payload.dedupe_key ?? '',
    reusedJob: payload.reused_job === true,
  }
}

export async function fetchModuleIntakeStatus(
  proposalId: string,
  jobId: string,
): Promise<IntakeStatusResult> {
  const supabase = await getSupabaseClient()
  const typedSupabase = supabase as unknown as {
    from: (table: string) => SupabaseTableQueryLike
  }

  const { data: proposal, error: proposalError } = await typedSupabase
    .from('module_intake_proposals')
    .select('id,status,last_error_message,drive_folder_id,library_drive_folder_id,module_drive_folder_id,manifest_drive_file_id')
    .eq('id', proposalId)
    .single<IntakeStatusProposalRow>()

  if (proposalError || !proposal) {
    throw new Error(proposalError?.message || 'Unable to read module intake proposal status.')
  }

  const { data: job, error: jobError } = await typedSupabase
    .from('drive_sync_jobs')
    .select('id,status,result_payload')
    .eq('id', jobId)
    .single<IntakeStatusJobRow>()

  if (jobError || !job) {
    throw new Error(jobError?.message || 'Unable to read module intake job status.')
  }

  return {
    status: proposal.status,
    proposalId: proposal.id,
    jobId: job.id,
    proposalStatus: proposal.status,
    jobStatus: job.status,
    lastErrorMessage: proposal.last_error_message ?? undefined,
    driveFolderId: proposal.drive_folder_id ?? undefined,
    libraryDriveFolderId: proposal.library_drive_folder_id ?? undefined,
    moduleDriveFolderId: proposal.module_drive_folder_id ?? undefined,
    manifestDriveFileId: proposal.manifest_drive_file_id ?? undefined,
    resultFiles: job.result_payload?.files,
  }
}
