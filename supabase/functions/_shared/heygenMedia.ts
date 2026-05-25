export type HeyGenNormalizedStatus = "pending" | "processing" | "succeeded" | "failed" | "cancelled" | "unknown";

export interface HeyGenCreateVideoRequest {
  type: "avatar";
  avatar_id: string;
  title?: string;
  aspect_ratio?: "16:9" | "9:16";
  output_format: "mp4";
  script: string;
  voice_id?: string;
  caption?: { file_format: "srt" };
  callback_id?: string;
}

export interface BuildHeyGenCreateVideoRequestInput {
  avatarId: string;
  script: string;
  title?: string;
  voiceId?: string;
  callbackId?: string;
  aspectRatio?: HeyGenCreateVideoRequest["aspect_ratio"];
  enableCaptions?: boolean;
}

export interface HeyGenSubmitResult {
  videoId: string;
  status: HeyGenNormalizedStatus;
  rawStatus?: string;
  outputFormat?: string;
}

export interface HeyGenVideoDetail {
  videoId: string;
  status: HeyGenNormalizedStatus;
  rawStatus?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  captionedVideoUrl?: string;
  subtitleUrl?: string;
  durationSeconds?: number;
  failureCode?: string;
  failureMessage?: string;
  videoPageUrl?: string;
}

export interface HeyGenClientConfig {
  apiKey: string;
  baseUrl?: string;
  fetcher?: typeof fetch;
}

export interface DownloadedHeyGenMedia {
  body: ArrayBuffer;
  contentType: string;
}

export class HeyGenMediaError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable = false,
  ) {
    super(message);
    this.name = "HeyGenMediaError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trimmedString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function dataRecord(responseJson: unknown, operation: string): Record<string, unknown> {
  if (!isRecord(responseJson) || !isRecord(responseJson.data)) {
    throw new HeyGenMediaError(`HeyGen ${operation} response did not include a data object.`);
  }

  return responseJson.data;
}

function normalizeStatus(rawStatus: unknown, data?: Record<string, unknown>): HeyGenNormalizedStatus {
  const status = typeof rawStatus === "string" ? rawStatus.toLowerCase().trim() : "";

  if (["completed", "complete", "success", "succeeded", "ready"].includes(status)) {
    return "succeeded";
  }

  if (["failed", "failure", "error"].includes(status)) {
    return "failed";
  }

  if (["cancelled", "canceled"].includes(status)) {
    return "cancelled";
  }

  if (["processing", "rendering", "running", "in_progress"].includes(status)) {
    return "processing";
  }

  if (["pending", "waiting", "queued", "submitted"].includes(status)) {
    return "pending";
  }

  if (trimmedString(data?.video_url)) {
    return "succeeded";
  }

  if (trimmedString(data?.failure_code) || trimmedString(data?.failure_message) || trimmedString(data?.error)) {
    return "failed";
  }

  return "unknown";
}

function heyGenBaseUrl(config: HeyGenClientConfig): string {
  return (config.baseUrl ?? "https://api.heygen.com/v3").replace(/\/+$/, "");
}

async function parseJsonResponse(response: Response, operation: string): Promise<unknown> {
  const bodyText = await response.text();
  let bodyJson: unknown = null;

  if (bodyText.trim().length > 0) {
    try {
      bodyJson = JSON.parse(bodyText);
    } catch (_error) {
      throw new HeyGenMediaError(`HeyGen ${operation} response was not valid JSON.`, response.status, response.status >= 500);
    }
  }

  if (!response.ok) {
    const detail = isRecord(bodyJson)
      ? trimmedString(bodyJson.message) ?? trimmedString(bodyJson.error) ?? JSON.stringify(bodyJson)
      : bodyText.trim();
    const suffix = detail ? `: ${detail}` : ".";
    throw new HeyGenMediaError(
      `HeyGen ${operation} request failed (${response.status})${suffix}`,
      response.status,
      response.status === 429 || response.status >= 500,
    );
  }

  return bodyJson;
}

export function buildHeyGenCreateVideoRequest(input: BuildHeyGenCreateVideoRequestInput): HeyGenCreateVideoRequest {
  const avatarId = input.avatarId.trim();
  const script = input.script.trim();

  if (!avatarId) {
    throw new HeyGenMediaError("HeyGen avatarId is required for avatar video creation.");
  }

  if (!script) {
    throw new HeyGenMediaError("HeyGen script is required for avatar video creation.");
  }

  return {
    type: "avatar",
    avatar_id: avatarId,
    title: input.title?.trim() || undefined,
    aspect_ratio: input.aspectRatio ?? "16:9",
    output_format: "mp4",
    script,
    voice_id: input.voiceId?.trim() || undefined,
    caption: input.enableCaptions === false ? undefined : { file_format: "srt" },
    callback_id: input.callbackId?.trim() || undefined,
  };
}

export function parseHeyGenSubmitResponse(responseJson: unknown): HeyGenSubmitResult {
  const data = dataRecord(responseJson, "create video");
  const videoId = trimmedString(data.video_id) ?? trimmedString(data.id);

  if (!videoId) {
    throw new HeyGenMediaError("HeyGen create video response did not include data.video_id.");
  }

  const rawStatus = trimmedString(data.status);

  return {
    videoId,
    status: normalizeStatus(rawStatus, data),
    rawStatus,
    outputFormat: trimmedString(data.output_format),
  };
}

export function parseHeyGenVideoDetailResponse(responseJson: unknown): HeyGenVideoDetail {
  const data = dataRecord(responseJson, "get video");
  const videoId = trimmedString(data.id) ?? trimmedString(data.video_id);

  if (!videoId) {
    throw new HeyGenMediaError("HeyGen get video response did not include data.id.");
  }

  const rawStatus = trimmedString(data.status);
  const duration = finiteNumber(data.duration) ?? finiteNumber(data.duration_seconds);

  return {
    videoId,
    status: normalizeStatus(rawStatus, data),
    rawStatus,
    videoUrl: trimmedString(data.video_url),
    thumbnailUrl: trimmedString(data.thumbnail_url),
    captionedVideoUrl: trimmedString(data.captioned_video_url),
    subtitleUrl: trimmedString(data.subtitle_url),
    durationSeconds: duration,
    failureCode: trimmedString(data.failure_code),
    failureMessage: trimmedString(data.failure_message) ?? trimmedString(data.error),
    videoPageUrl: trimmedString(data.video_page_url),
  };
}

export async function submitHeyGenVideo(
  config: HeyGenClientConfig,
  request: HeyGenCreateVideoRequest,
  idempotencyKey?: string,
): Promise<HeyGenSubmitResult> {
  if (!config.apiKey.trim()) {
    throw new HeyGenMediaError("HEYGEN_API_KEY is required before HeyGen video submission can run.");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "x-api-key": config.apiKey,
  });

  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  const response = await (config.fetcher ?? fetch)(`${heyGenBaseUrl(config)}/videos`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  return parseHeyGenSubmitResponse(await parseJsonResponse(response, "create video"));
}

export async function getHeyGenVideo(config: HeyGenClientConfig, videoId: string): Promise<HeyGenVideoDetail> {
  const normalizedVideoId = videoId.trim();

  if (!config.apiKey.trim()) {
    throw new HeyGenMediaError("HEYGEN_API_KEY is required before HeyGen video polling can run.");
  }

  if (!normalizedVideoId) {
    throw new HeyGenMediaError("HeyGen video id is required for polling.");
  }

  const response = await (config.fetcher ?? fetch)(
    `${heyGenBaseUrl(config)}/videos/${encodeURIComponent(normalizedVideoId)}`,
    { headers: { "x-api-key": config.apiKey } },
  );

  return parseHeyGenVideoDetailResponse(await parseJsonResponse(response, "get video"));
}

export async function downloadHeyGenMedia(url: string, fetcher: typeof fetch = fetch): Promise<DownloadedHeyGenMedia> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch (_error) {
    throw new HeyGenMediaError("HeyGen video_url was not a valid URL.");
  }

  if (parsedUrl.protocol !== "https:") {
    throw new HeyGenMediaError("HeyGen video_url must use HTTPS before server-side download.");
  }

  const response = await fetcher(parsedUrl.toString());

  if (!response.ok) {
    throw new HeyGenMediaError(
      `HeyGen media download failed (${response.status}).`,
      response.status,
      response.status === 429 || response.status >= 500,
    );
  }

  return {
    body: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") ?? "video/mp4",
  };
}

export function buildMediaStoragePath(params: {
  moduleVersionId: string;
  mediaAssetId: string;
  extension?: string;
}): string {
  const extension = (params.extension ?? "mp4").replace(/[^a-z0-9]/gi, "").toLowerCase() || "mp4";
  return `heygen/${params.moduleVersionId}/${params.mediaAssetId}.${extension}`;
}
