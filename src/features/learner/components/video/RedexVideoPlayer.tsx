import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { Download, RotateCcw } from 'lucide-react';

import type {
  VideoCheckpoint,
  VideoCheckpointCompletion,
  VideoCheckpointProgress,
  VideoLessonContent,
  VideoTranscriptSegment,
} from '@/lib/education';
import { getAnswerableRequiredVideoCheckpoints } from './videoCheckpointRules';

interface RedexVideoPlayerProps {
  lessonId: string;
  content: VideoLessonContent;
  onCheckpointProgress?: (progress: VideoCheckpointProgress) => void;
}

type ActiveCheckpointState = {
  checkpoint: VideoCheckpoint;
  selectedOptionIndex?: number;
  correct?: boolean;
  feedbackMarkdown?: string;
  canContinue: boolean;
};

function formatTimestamp(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function clampSeconds(value: number, maxSeconds?: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const lowerBounded = Math.max(0, value);

  return typeof maxSeconds === 'number' && Number.isFinite(maxSeconds)
    ? Math.min(lowerBounded, maxSeconds)
    : lowerBounded;
}

function isNumericSecondsParam(value: string): boolean {
  return /^\d+(?:\.\d+)?$/.test(value.trim());
}

function safeReadStorage(key: string): number | null {
  try {
    const storedValue = window.localStorage.getItem(key);
    if (storedValue === null) {
      return null;
    }

    const parsed = Number(storedValue);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function safeWriteStorage(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(Math.max(0, Math.floor(value))));
  } catch {
    // Resume is best-effort only.
  }
}

function updateTimeQuery(seconds: number): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('t', String(Math.max(0, Math.floor(seconds))));
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // Deep links are best-effort only.
  }
}

function getInitialSeconds(storageKey: string, maxSeconds?: number): number {
  try {
    const value = new URLSearchParams(window.location.search).get('t');
    if (value && isNumericSecondsParam(value)) {
      return clampSeconds(Number(value), maxSeconds);
    }
  } catch {
    // Ignore malformed or unavailable window location.
  }

  return clampSeconds(safeReadStorage(storageKey) ?? 0, maxSeconds);
}

function buildProgress(
  lessonId: string,
  content: VideoLessonContent,
  completions: readonly VideoCheckpointCompletion[],
): VideoCheckpointProgress {
  const answeredCheckpointIds = completions.map((completion) => completion.checkpoint_id);
  const answeredSet = new Set(answeredCheckpointIds);
  const requiredCheckpointIds = getAnswerableRequiredVideoCheckpoints(content).map((checkpoint) => checkpoint.id);

  return {
    lesson_id: lessonId,
    answered_checkpoint_ids: answeredCheckpointIds,
    required_checkpoint_ids: requiredCheckpointIds,
    all_required_answered: requiredCheckpointIds.every((checkpointId) => answeredSet.has(checkpointId)),
    completions: [...completions],
  };
}

function getTranscriptSegments(content: VideoLessonContent): VideoTranscriptSegment[] {
  if (content.transcript_segments && content.transcript_segments.length > 0) {
    return [...content.transcript_segments].sort((left, right) => left.start_seconds - right.start_seconds);
  }

  if (content.transcript_markdown?.trim()) {
    return [
      {
        id: 'fallback-transcript',
        start_seconds: 0,
        end_seconds: content.duration_seconds ?? Number.MAX_SAFE_INTEGER,
        text_markdown: content.transcript_markdown,
        derived_from_section_ids: [],
      },
    ];
  }

  return [];
}

function getRewatchSeconds(checkpoint: VideoCheckpoint, chapters: VideoLessonContent['chapters']): number {
  if (typeof checkpoint.segment_start_seconds === 'number') {
    return checkpoint.segment_start_seconds;
  }

  const previousChapter = [...(chapters ?? [])]
    .sort((left, right) => left.start_seconds - right.start_seconds)
    .filter((chapter) => chapter.start_seconds <= checkpoint.at_seconds)
    .at(-1);

  return previousChapter?.start_seconds ?? Math.max(0, checkpoint.at_seconds - 60);
}

function tryPause(video: HTMLVideoElement | null): void {
  try {
    video?.pause();
  } catch {
    // jsdom and some browsers can reject media actions; checkpoint UI still works.
  }
}

function checkpointHeadingId(checkpointId: string): string {
  return `video-checkpoint-${checkpointId.replace(/[^a-zA-Z0-9_-]/g, '-')}-heading`;
}

function tryPlay(video: HTMLVideoElement | null): void {
  try {
    const maybePromise = video?.play();
    if (maybePromise && typeof maybePromise.catch === 'function') {
      maybePromise.catch(() => undefined);
    }
  } catch {
    // Continuing from a checkpoint should not fail the UI if autoplay is blocked.
  }
}

function RedexVideoPlayerState({ lessonId, content, onCheckpointProgress }: RedexVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const latestSecondsRef = useRef(0);
  const lastPersistedSecondRef = useRef(0);
  const checkpointSurfaceRef = useRef<HTMLDivElement | null>(null);
  const storageKey = `redex:video-resume:${lessonId}:${content.media_asset_id ?? content.video_url}`;
  const initialSeconds = useMemo(
    () => getInitialSeconds(storageKey, content.duration_seconds),
    [content.duration_seconds, storageKey],
  );

  const [currentSeconds, setCurrentSeconds] = useState(initialSeconds);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(content.duration_seconds ?? null);
  const [activeCheckpoint, setActiveCheckpoint] = useState<ActiveCheckpointState | null>(null);
  const [completions, setCompletions] = useState<VideoCheckpointCompletion[]>([]);
  const [hasStarted, setHasStarted] = useState(initialSeconds > 0);
  const [hasMediaError, setHasMediaError] = useState(false);

  const sortedChapters = useMemo(
    () => [...(content.chapters ?? [])].sort((left, right) => left.start_seconds - right.start_seconds),
    [content.chapters],
  );

  const sortedCheckpoints = useMemo(
    () => [...(content.checkpoints ?? [])].sort((left, right) => left.at_seconds - right.at_seconds || left.id.localeCompare(right.id)),
    [content.checkpoints],
  );

  const transcriptSegments = useMemo(() => getTranscriptSegments(content), [content]);

  const activeTranscriptSegmentId = useMemo(() => {
    const segment = transcriptSegments.find(
      (candidate) => candidate.start_seconds <= currentSeconds && currentSeconds < candidate.end_seconds,
    );

    return segment?.id ?? null;
  }, [currentSeconds, transcriptSegments]);
  const activeCheckpointId = activeCheckpoint?.checkpoint.id ?? null;

  useEffect(() => {
    const video = videoRef.current;

    if (video) {
      video.currentTime = initialSeconds;
    }

    latestSecondsRef.current = initialSeconds;
  }, [initialSeconds]);

  useEffect(() => {
    latestSecondsRef.current = currentSeconds;
  }, [currentSeconds]);

  useEffect(() => {
    onCheckpointProgress?.(buildProgress(lessonId, content, completions));
  }, [completions, content, lessonId, onCheckpointProgress]);

  useEffect(() => {
    if (activeCheckpointId !== null) {
      checkpointSurfaceRef.current?.focus();
    }
  }, [activeCheckpointId]);

  useEffect(() => {
    return () => {
      safeWriteStorage(storageKey, latestSecondsRef.current);
    };
  }, [storageKey]);

  const seekTo = (seconds: number, shouldUpdateUrl: boolean) => {
    const maxSeconds = durationSeconds ?? content.duration_seconds;
    const nextSeconds = clampSeconds(seconds, maxSeconds);
    const video = videoRef.current;

    if (video) {
      video.currentTime = nextSeconds;
    }

    latestSecondsRef.current = nextSeconds;
    setCurrentSeconds(nextSeconds);
    safeWriteStorage(storageKey, nextSeconds);

    if (shouldUpdateUrl) {
      updateTimeQuery(nextSeconds);
    }
  };

  const persistPlaybackPosition = (seconds: number) => {
    if (Math.abs(seconds - lastPersistedSecondRef.current) >= 5) {
      safeWriteStorage(storageKey, seconds);
      lastPersistedSecondRef.current = seconds;
    }
  };

  const recordCompletion = (completion: VideoCheckpointCompletion) => {
    setCompletions((previous) => {
      if (previous.some((existing) => existing.checkpoint_id === completion.checkpoint_id)) {
        return previous;
      }

      return [...previous, completion];
    });
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    const nextSeconds = video?.currentTime ?? 0;
    const answeredCheckpointIds = new Set(completions.map((completion) => completion.checkpoint_id));
    const nextCheckpoint = sortedCheckpoints.find(
      (checkpoint) => !answeredCheckpointIds.has(checkpoint.id) && checkpoint.at_seconds <= nextSeconds + 0.5,
    );

    latestSecondsRef.current = nextSeconds;
    setCurrentSeconds(nextSeconds);
    setHasStarted(nextSeconds > 0 || hasStarted);
    persistPlaybackPosition(nextSeconds);

    if (nextCheckpoint && activeCheckpoint?.checkpoint.id !== nextCheckpoint.id) {
      tryPause(video);
      setActiveCheckpoint({ checkpoint: nextCheckpoint, canContinue: false });
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    const naturalDuration = video?.duration;

    if (typeof naturalDuration === 'number' && Number.isFinite(naturalDuration)) {
      setDurationSeconds(naturalDuration);
    }
  };

  const handleAnswerCheckpoint = (checkpoint: VideoCheckpoint, selectedOptionIndex?: number) => {
    const hasAutoGrading = typeof checkpoint.correct_index === 'number' && typeof selectedOptionIndex === 'number';
    const correct = hasAutoGrading ? selectedOptionIndex === checkpoint.correct_index : undefined;
    const mustAnswerCorrectly = checkpoint.must_answer_correctly === true;
    const canContinue = !mustAnswerCorrectly || correct !== false;
    const feedbackMarkdown = correct === false
      ? checkpoint.feedback_incorrect_markdown
      : checkpoint.feedback_correct_markdown;

    setActiveCheckpoint({
      checkpoint,
      selectedOptionIndex,
      correct,
      feedbackMarkdown,
      canContinue,
    });

    if (canContinue) {
      recordCompletion({
        checkpoint_id: checkpoint.id,
        answered_at: new Date().toISOString(),
        selected_option_index: selectedOptionIndex,
        correct,
      });
    }
  };

  const handleRewatch = (checkpoint: VideoCheckpoint) => {
    const rewatchSeconds = getRewatchSeconds(checkpoint, sortedChapters);

    setActiveCheckpoint(null);
    seekTo(rewatchSeconds, true);
  };

  const handleContinue = () => {
    setActiveCheckpoint(null);
    tryPlay(videoRef.current);
  };

  const primaryDownloadUrl = content.download_url ?? content.downloads?.[0]?.url;
  const primaryDownloadLabel = content.downloads?.[0]?.label ?? 'Download for offline';
  const activeCheckpointHeadingId = activeCheckpointId ? checkpointHeadingId(activeCheckpointId) : undefined;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6" role="region" aria-label="Redex video player">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
            <video
              ref={videoRef}
              aria-label="Training video"
              className="aspect-video w-full bg-slate-950"
              controls
              poster={content.poster_url}
              preload="metadata"
              src={content.video_url}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setHasStarted(true)}
              onPause={() => safeWriteStorage(storageKey, latestSecondsRef.current)}
              onError={() => setHasMediaError(true)}
            />

            {activeCheckpoint ? (
              <div className="absolute inset-0 overflow-auto bg-slate-950/95 p-4 text-white md:p-6">
                <div
                  ref={checkpointSurfaceRef}
                  role="group"
                  aria-labelledby={activeCheckpointHeadingId}
                  tabIndex={-1}
                  className="mx-auto flex min-h-full max-w-2xl flex-col justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  <p className="text-xs font-semibold uppercase tracking-[3px] text-redex-red">Checkpoint</p>
                  <h3 id={activeCheckpointHeadingId} className="mt-3 text-2xl font-semibold tracking-tight">{activeCheckpoint.checkpoint.question}</h3>
                  <p className="mt-2 text-sm text-slate-300">At {formatTimestamp(activeCheckpoint.checkpoint.at_seconds)}</p>

                  {activeCheckpoint.checkpoint.options && activeCheckpoint.checkpoint.options.length > 0 ? (
                    <div className="mt-5 grid gap-3">
                      {activeCheckpoint.checkpoint.options.map((option, index) => (
                        <button
                          key={`${activeCheckpoint.checkpoint.id}-${option}`}
                          type="button"
                          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-left text-sm font-medium transition hover:border-redex-red hover:bg-redex-red/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          aria-pressed={activeCheckpoint.selectedOptionIndex === index}
                          onClick={() => handleAnswerCheckpoint(activeCheckpoint.checkpoint, index)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mt-5 rounded-xl bg-redex-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-redex-red/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      onClick={() => handleAnswerCheckpoint(activeCheckpoint.checkpoint)}
                    >
                      Acknowledge checkpoint
                    </button>
                  )}

                  {activeCheckpoint.feedbackMarkdown ? (
                    <div className="prose prose-invert mt-5 max-w-none text-sm" role="status" aria-live="polite">
                      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{activeCheckpoint.feedbackMarkdown}</ReactMarkdown>
                    </div>
                  ) : null}

                  {activeCheckpoint.correct === false ? (
                    <button
                      type="button"
                      className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                      onClick={() => handleRewatch(activeCheckpoint.checkpoint)}
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" /> Re-watch that part
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="mt-5 inline-flex w-fit items-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-300"
                    disabled={!activeCheckpoint.canContinue}
                    onClick={handleContinue}
                  >
                    Continue video
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {hasMediaError ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
              We couldn't load this video asset. Try again later or contact your training owner.
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span>{hasStarted ? `Current time ${formatTimestamp(currentSeconds)}` : 'Ready to play'}</span>
            {durationSeconds ? <span>Duration {formatTimestamp(durationSeconds)}</span> : null}
            {content.media_status && content.media_status !== 'ready' ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">Media status: {content.media_status}</span>
            ) : null}
          </div>

          <div className="mt-4">
            {primaryDownloadUrl ? (
              <a
                href={primaryDownloadUrl}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-redex-red hover:text-redex-red"
              >
                <Download className="h-4 w-4" aria-hidden="true" /> {primaryDownloadLabel}
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400"
                title="Offline downloads are not available for this video yet."
              >
                <Download className="h-4 w-4" aria-hidden="true" /> Download for offline
              </button>
            )}
            {!primaryDownloadUrl ? (
              <p className="mt-2 text-xs text-slate-500">Offline downloads are not available for this video yet.</p>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4">
          {sortedChapters.length > 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-redex-offwhite p-4" aria-labelledby="video-chapters-heading">
              <h3 id="video-chapters-heading" className="text-sm font-semibold uppercase tracking-[2px] text-slate-500">Chapters</h3>
              <div className="mt-3 space-y-2">
                {sortedChapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    type="button"
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-redex-red hover:text-redex-red"
                    onClick={() => seekTo(chapter.start_seconds, true)}
                  >
                    <span className="font-semibold text-slate-900">{chapter.title}</span>
                    <span className="ml-2 text-xs text-slate-500">{formatTimestamp(chapter.start_seconds)}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {transcriptSegments.length > 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-redex-offwhite p-4" aria-labelledby="video-transcript-heading">
              <h3 id="video-transcript-heading" className="text-sm font-semibold uppercase tracking-[2px] text-slate-500">Transcript</h3>
              <div className="mt-3 max-h-80 space-y-2 overflow-auto pr-1">
                {transcriptSegments.map((segment) => (
                  <button
                    key={segment.id}
                    type="button"
                    className={`block w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                      activeTranscriptSegmentId === segment.id
                        ? 'border-redex-red bg-white text-slate-900 shadow-sm'
                        : 'border-slate-200 bg-white/80 text-slate-700 hover:border-redex-red'
                    }`}
                    aria-current={activeTranscriptSegmentId === segment.id ? 'true' : undefined}
                    onClick={() => seekTo(segment.start_seconds, true)}
                  >
                    <span className="text-xs font-semibold text-redex-red">{formatTimestamp(segment.start_seconds)}</span>
                    <span className="sr-only"> Seek transcript segment </span>
                    <span className="mt-1 block">{segment.text_markdown}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

export function RedexVideoPlayer(props: RedexVideoPlayerProps) {
  const resetKey = `${props.lessonId}:${props.content.media_asset_id ?? props.content.video_url}`;

  return <RedexVideoPlayerState key={resetKey} {...props} />;
}
