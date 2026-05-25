import {
  buildHeyGenCreateVideoRequest,
  parseHeyGenSubmitResponse,
  parseHeyGenVideoDetailResponse,
} from "./heygenMedia.ts";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals<T>(actual: T, expected: T) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Assertion failed.\nActual: ${JSON.stringify(actual)}\nExpected: ${JSON.stringify(expected)}`);
  }
}

const maybeVitestDescribe = (globalThis as unknown as {
  describe?: { skip?: (name: string, fn: () => void) => void };
}).describe;

if (maybeVitestDescribe?.skip) {
  maybeVitestDescribe.skip("Deno-only HeyGen media helper tests", () => {});
}

if (typeof Deno !== "undefined") {
  Deno.test("buildHeyGenCreateVideoRequest creates conservative v3 avatar payload", () => {
    const request = buildHeyGenCreateVideoRequest({
      avatarId: " avatar-123 ",
      voiceId: " voice-456 ",
      script: " Approved training script. ",
      title: " Safety Basics ",
      callbackId: "job-1",
    });

    assertEquals(request, {
      type: "avatar",
      avatar_id: "avatar-123",
      title: "Safety Basics",
      aspect_ratio: "16:9",
      output_format: "mp4",
      script: "Approved training script.",
      voice_id: "voice-456",
      caption: { file_format: "srt" },
      callback_id: "job-1",
    });
  });

  Deno.test("parseHeyGenSubmitResponse accepts video_id and normalizes submitted status", () => {
    const parsed = parseHeyGenSubmitResponse({
      data: { video_id: "video-123", status: "submitted", output_format: "mp4" },
    });

    assertEquals(parsed.videoId, "video-123");
    assertEquals(parsed.status, "pending");
    assertEquals(parsed.outputFormat, "mp4");
  });

  Deno.test("parseHeyGenVideoDetailResponse infers success from video_url when status is omitted", () => {
    const parsed = parseHeyGenVideoDetailResponse({
      data: {
        id: "video-123",
        video_url: "https://files.heygen.ai/video/video-123.mp4",
        thumbnail_url: "https://files.heygen.ai/thumb/video-123.jpg",
        subtitle_url: "https://files.heygen.ai/srt/video-123.srt",
        duration: 30.5,
      },
    });

    assertEquals(parsed.videoId, "video-123");
    assertEquals(parsed.status, "succeeded");
    assertEquals(parsed.durationSeconds, 30.5);
    assertEquals(parsed.subtitleUrl, "https://files.heygen.ai/srt/video-123.srt");
  });

  Deno.test("parseHeyGenVideoDetailResponse reports clear malformed responses", () => {
    try {
      parseHeyGenVideoDetailResponse({ data: { status: "completed" } });
    } catch (error) {
      assert(error instanceof Error, "error should be an Error");
      const message = error instanceof Error ? error.message : String(error);
      assert(message.includes("data.id"), "error should mention missing data.id");
      return;
    }

    throw new Error("expected parse error");
  });
}
