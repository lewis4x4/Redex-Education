import {
  buildHeyGenCreateVideoRequest,
  submitHeyGenVideo,
  type HeyGenCreateVideoRequest,
} from "../_shared/heygenMedia.ts";
import {
  assertServiceRoleCaller,
  errorResponse,
  jsonResponse,
  optionalString,
  parseJsonRecord,
  requiredString,
  requireEnv,
  requireMediaStageEnabled,
  requirePostOrOptions,
  type EnvReader,
} from "../_shared/mediaWrapper.ts";

interface HeyGenSubmitHandlerDeps {
  getEnv: EnvReader;
  fetcher?: typeof fetch;
}

function aspectRatio(body: Record<string, unknown>): HeyGenCreateVideoRequest["aspect_ratio"] | undefined {
  const value = optionalString(body, "aspectRatio");
  const allowed = new Set(["16:9", "9:16"]);
  return value && allowed.has(value) ? value as HeyGenCreateVideoRequest["aspect_ratio"] : undefined;
}

export function createHeyGenSubmitHandler(deps: HeyGenSubmitHandlerDeps): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const methodResponse = requirePostOrOptions(request, "heygen-submit");
    if (methodResponse) return methodResponse;

    try {
      assertServiceRoleCaller(request, deps.getEnv, "heygen-submit");
      requireMediaStageEnabled(deps.getEnv);
      const apiKey = requireEnv(deps.getEnv, "HEYGEN_API_KEY");
      const body = await parseJsonRecord(request);
      const createRequest = buildHeyGenCreateVideoRequest({
        avatarId: requiredString(body, "avatarId"),
        script: requiredString(body, "script"),
        title: optionalString(body, "title"),
        voiceId: optionalString(body, "voiceId"),
        callbackId: optionalString(body, "callbackId"),
        aspectRatio: aspectRatio(body),
        enableCaptions: typeof body.enableCaptions === "boolean" ? body.enableCaptions : undefined,
      });
      const result = await submitHeyGenVideo(
        {
          apiKey,
          baseUrl: deps.getEnv("HEYGEN_BASE_URL"),
          fetcher: deps.fetcher,
        },
        createRequest,
        optionalString(body, "idempotencyKey") ?? optionalString(body, "callbackId"),
      );

      return jsonResponse({
        status: "ok",
        video_id: result.videoId,
        provider_status: result.status,
        raw_provider_status: result.rawStatus ?? null,
        output_format: result.outputFormat ?? null,
      });
    } catch (error) {
      return errorResponse(error, "heygen_submit_failed");
    }
  };
}
