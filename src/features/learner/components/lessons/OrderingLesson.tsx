import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { OrderingCompletion, OrderingLessonContent, OrderingStep, UUID } from '@/lib/education';

interface OrderingLessonProps {
  lessonId: UUID;
  content: OrderingLessonContent;
  onComplete?: (completion: OrderingCompletion) => void;
}

type CheckResult = {
  orderedStepIds: UUID[];
  correctByPosition: boolean[];
  isCorrect: boolean;
};

function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRandom(seed: string) {
  let state = hashSeed(seed) || 1;

  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

function isSameOrder(left: readonly UUID[], right: readonly UUID[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function shuffledInitialOrder(lessonId: UUID, steps: readonly OrderingStep[]): UUID[] {
  const canonicalIds = steps.map((step) => step.id);

  if (canonicalIds.length <= 1) {
    return canonicalIds;
  }

  const random = seededRandom(lessonId);
  const shuffled = [...canonicalIds];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = shuffled[index];
    const swap = shuffled[swapIndex];

    if (current !== undefined && swap !== undefined) {
      shuffled[index] = swap;
      shuffled[swapIndex] = current;
    }
  }

  if (isSameOrder(shuffled, canonicalIds)) {
    const first = shuffled.shift();
    if (first !== undefined) {
      shuffled.push(first);
    }
  }

  return shuffled;
}

function validationMessage(content: OrderingLessonContent): string | null {
  if (content.steps.length === 0) {
    return 'This ordering lesson has no steps configured yet.';
  }

  const stepIds = new Set<string>();

  for (const step of content.steps) {
    if (step.id.trim().length === 0 || step.label.trim().length === 0) {
      return 'This ordering lesson has a step with a missing id or label.';
    }

    if (stepIds.has(step.id)) {
      return 'This ordering lesson has duplicate step ids.';
    }

    stepIds.add(step.id);
  }

  return null;
}

function moveId(ids: UUID[], fromIndex: number, toIndex: number): UUID[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= ids.length || toIndex >= ids.length || fromIndex === toIndex) {
    return ids;
  }

  const next = [...ids];
  const [item] = next.splice(fromIndex, 1);

  if (item === undefined) {
    return ids;
  }

  next.splice(toIndex, 0, item);
  return next;
}

export function OrderingLesson({ lessonId, content, onComplete }: OrderingLessonProps) {
  const [orderedStepIds, setOrderedStepIds] = useState<UUID[]>(() => shuffledInitialOrder(lessonId, content.steps));
  const [draggedStepId, setDraggedStepId] = useState<UUID | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const invalidMessage = useMemo(() => validationMessage(content), [content]);
  const canonicalStepIds = useMemo(() => content.steps.map((step) => step.id), [content.steps]);
  const stepById = useMemo(() => new Map(content.steps.map((step) => [step.id, step])), [content.steps]);

  const clearEditableFeedback = () => {
    if (!isCompleted) {
      setCheckResult(null);
    }
  };

  const moveStep = (stepId: UUID, direction: -1 | 1) => {
    if (isCompleted) {
      return;
    }

    setOrderedStepIds((prev) => {
      const fromIndex = prev.indexOf(stepId);
      const toIndex = fromIndex + direction;
      const next = moveId(prev, fromIndex, toIndex);

      return next;
    });
    clearEditableFeedback();
  };

  const dropOnStep = (targetStepId: UUID) => {
    if (!draggedStepId || isCompleted) {
      return;
    }

    setOrderedStepIds((prev) => moveId(prev, prev.indexOf(draggedStepId), prev.indexOf(targetStepId)));
    setDraggedStepId(null);
    clearEditableFeedback();
  };

  const checkOrder = () => {
    if (isCompleted) {
      return;
    }

    const nextAttemptCount = attemptCount + 1;
    const correctByPosition = orderedStepIds.map((stepId, index) => stepId === canonicalStepIds[index]);
    const isCorrect = correctByPosition.every(Boolean) && correctByPosition.length === canonicalStepIds.length;
    const nextResult = { orderedStepIds: [...orderedStepIds], correctByPosition, isCorrect };

    setAttemptCount(nextAttemptCount);
    setCheckResult(nextResult);

    if (!isCorrect) {
      return;
    }

    setIsCompleted(true);
    onComplete?.({
      lesson_id: lessonId,
      completed_at: new Date().toISOString(),
      ordered_step_ids: [...orderedStepIds],
      attempt_count: nextAttemptCount,
    });
  };

  if (invalidMessage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[3px] text-amber-700">Ordering lesson unavailable</p>
        <p className="mt-3 text-sm text-amber-900">{invalidMessage}</p>
      </div>
    );
  }

  const visibleSteps = orderedStepIds.map((stepId) => stepById.get(stepId)).filter((step): step is OrderingStep => step !== undefined);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      {content.intro_markdown?.trim() ? (
        <div className="prose max-w-none text-slate-700">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content.intro_markdown}</ReactMarkdown>
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-slate-200 bg-redex-offwhite p-4">
        <p className="text-xs font-semibold uppercase tracking-[2px] text-slate-500">Sequence these steps</p>
        <ol className="mt-4 space-y-3" aria-label="Ordering steps">
          {visibleSteps.map((step, index) => {
            const expectedStep = content.steps[index];
            const checkedPosition = checkResult?.correctByPosition[index];
            const showFeedback = checkResult !== null;
            const isFirst = index === 0;
            const isLast = index === visibleSteps.length - 1;

            return (
              <li
                key={step.id}
                draggable={!isCompleted}
                onDragStart={() => setDraggedStepId(step.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => dropOnStep(step.id)}
                onDragEnd={() => setDraggedStepId(null)}
                className={`rounded-xl border bg-white p-4 shadow-sm transition ${
                  draggedStepId === step.id ? 'border-redex-red opacity-70' : 'border-slate-200'
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-redex-red/10 text-sm font-semibold text-redex-red">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <p className="text-sm font-semibold leading-6 text-slate-900">{step.label}</p>
                      </div>
                      {step.detail_markdown?.trim() ? (
                        <div className="prose mt-2 max-w-none text-sm text-slate-700">
                          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{step.detail_markdown}</ReactMarkdown>
                        </div>
                      ) : null}
                      {step.source_section_id ? (
                        <p className="mt-2 text-xs font-medium text-slate-500">Source section: {step.source_section_id}</p>
                      ) : null}
                      {showFeedback ? (
                        <p className={`mt-3 text-sm font-medium ${checkedPosition ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {checkedPosition ? 'Correct position' : `Expected here: ${expectedStep?.label ?? 'another step'}`}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-redex-red hover:text-redex-red disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Move "${step.label}" up`}
                      disabled={isFirst || isCompleted}
                      onClick={() => moveStep(step.id, -1)}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-redex-red hover:text-redex-red disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Move "${step.label}" down`}
                      disabled={isLast || isCompleted}
                      onClick={() => moveStep(step.id, 1)}
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {checkResult ? (
        <div
          className={`mt-6 rounded-xl border p-4 text-sm ${
            checkResult.isCorrect
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
          role="status"
          aria-live="polite"
        >
          {checkResult.isCorrect
            ? `Correct — sequence completed in ${attemptCount} attempt${attemptCount === 1 ? '' : 's'}.`
            : 'Some steps are out of order. Review the position feedback and try again.'}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="brand"
          className="disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          disabled={isCompleted}
          onClick={checkOrder}
        >
          {isCompleted ? 'Order completed' : 'Check order'}
        </Button>
        {checkResult && !checkResult.isCorrect ? (
          <Button type="button" variant="outline" onClick={() => setCheckResult(null)}>
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}
