import { getHeyGenVideo } from "../_shared/heygenMedia.ts";
import {
  assertServiceRoleCaller,
  errorResponse,
  jsonResponse,
  parseJsonRecord,
  requiredString,
  requireEnv,
  requireMediaStageEnabled,
  requirePostOrOptions,
  type EnvReader,
} from "../_shared/mediaWrapper.ts";

interface HeyGenPollHandlerDeps {
  getEnv: EnvReader;
  fetcher?: typeof fetch;
}

export function createHeyGenPollHandler(deps: HeyGenPollHandlerDeps): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const methodResponse = requirePostOrOptions(request, "heygen-poll");
    if (methodResponse) return methodResponse;

    try {
      assertServiceRoleCaller(request, deps.getEnv, "heygen-poll");
      requireMediaStageEnabled(deps.getEnv);
      const apiKey = requireEnv(deps.getEnv, "HEYGEN_API_KEY");
      const body = await parseJsonRecord(request);
      const detail = await getHeyGenVideo(
        {
          apiKey,
          baseUrl: deps.getEnv("HEYGEN_BASE_URL"),
          fetcher: deps.fetcher,
        },
        requiredString(body, "videoId"),
      );

      return jsonResponse({
        status: "ok",
        video_id: detail.videoId,
        provider_status: detail.status,
        raw_provider_status: detail.rawStatus ?? null,
        video_url: detail.videoUrl ?? null,
        thumbnail_url: detail.thumbnailUrl ?? null,
        captioned_video_url: detail.captionedVideoUrl ?? null,
        subtitle_url: detail.subtitleUrl ?? null,
        duration_seconds: detail.durationSeconds ?? null,
        failure_code: detail.failureCode ?? null,
        failure_message: detail.failureMessage ?? null,
        video_page_url: detail.videoPageUrl ?? null,
      });
    } catch (error) {
      return errorResponse(error, "heygen_poll_failed");
    }
  };
}
