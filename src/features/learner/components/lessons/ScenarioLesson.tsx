import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

import { Button } from '@/components/ui/button';
import type { ScenarioChoice, ScenarioCompletion, ScenarioLessonContent, ScenarioStep, UUID } from '@/lib/education';
import { ScenarioChoiceCard } from './ScenarioChoiceCard';

interface ScenarioLessonProps {
  lessonId: UUID;
  content: ScenarioLessonContent;
  onComplete?: (completion: ScenarioCompletion) => void;
}

type Phase = 'intro' | 'decision' | 'summary';

function normalizeFeedback(choice: ScenarioChoice) {
  return choice.feedback_markdown?.trim() || 'Selection recorded. Continue when ready.';
}

export function ScenarioLesson({ lessonId, content, onComplete }: ScenarioLessonProps) {
  const introMarkdown = content.intro_markdown?.trim() ?? '';
  const hasIntro = introMarkdown.length > 0;
  const steps = content.steps;

  const [phase, setPhase] = useState<Phase>(hasIntro ? 'intro' : 'decision');
  const [currentStepId, setCurrentStepId] = useState<UUID | null>(steps[0]?.id ?? null);
  const [selectedChoiceId, setSelectedChoiceId] = useState<UUID | null>(null);
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<Record<UUID, UUID>>({});
  const [visitedStepIds, setVisitedStepIds] = useState<UUID[]>(steps[0]?.id ? [steps[0].id] : []);
  const [isCompleted, setIsCompleted] = useState(false);
  const [configurationError, setConfigurationError] = useState<string | null>(null);

  const currentStep = useMemo<ScenarioStep | null>(
    () => steps.find((step) => step.id === currentStepId) ?? null,
    [steps, currentStepId],
  );

  const selectedChoice = useMemo<ScenarioChoice | null>(() => {
    if (!currentStep || !selectedChoiceId) {
      return null;
    }

    return currentStep.choices.find((choice) => choice.id === selectedChoiceId) ?? null;
  }, [currentStep, selectedChoiceId]);

  const startScenario = () => {
    setPhase('decision');
  };

  const selectChoice = (choiceId: UUID) => {
    if (!currentStep || selectedChoiceId !== null) {
      return;
    }

    setConfigurationError(null);
    setSelectedChoiceId(choiceId);
    setSelectedChoiceIds((prev) => ({ ...prev, [currentStep.id]: choiceId }));
  };

  const handleRetryChoice = () => {
    if (!currentStep) {
      return;
    }

    setSelectedChoiceId(null);
    setSelectedChoiceIds((prev) => {
      const next = { ...prev };
      delete next[currentStep.id];
      return next;
    });
  };

  const goToSummary = () => {
    setPhase('summary');
    setSelectedChoiceId(null);
  };

  const handleContinue = () => {
    if (!currentStep || !selectedChoice) {
      return;
    }

    setConfigurationError(null);

    if (selectedChoice.next_step_id === 'outcome') {
      goToSummary();
      return;
    }

    if (selectedChoice.next_step_id) {
      const target = steps.find((step) => step.id === selectedChoice.next_step_id);
      if (!target) {
        setConfigurationError('Scenario configuration error: next step target was not found.');
        return;
      }

      setCurrentStepId(target.id);
      setVisitedStepIds((prev) => (prev.includes(target.id) ? prev : [...prev, target.id]));
      setSelectedChoiceId(null);
      return;
    }

    const currentIndex = steps.findIndex((step) => step.id === currentStep.id);
    const nextStep = currentIndex > -1 ? steps[currentIndex + 1] : undefined;

    if (!nextStep) {
      goToSummary();
      return;
    }

    setCurrentStepId(nextStep.id);
    setVisitedStepIds((prev) => (prev.includes(nextStep.id) ? prev : [...prev, nextStep.id]));
    setSelectedChoiceId(null);
  };

  const completeScenario = () => {
    if (isCompleted) {
      return;
    }

    onComplete?.({
      lesson_id: lessonId,
      completed_at: new Date().toISOString(),
      selected_choice_ids: selectedChoiceIds,
      visited_step_ids: visitedStepIds,
    });

    setIsCompleted(true);
  };

  if (steps.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[3px] text-amber-700">Scenario unavailable</p>
        <p className="mt-3 text-sm text-amber-900">This scenario has no steps configured yet.</p>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[3px] text-redex-red">Scenario walkthrough</p>
        <div className="prose mt-4 max-w-none text-slate-700">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{introMarkdown}</ReactMarkdown>
        </div>
        <Button type="button" variant="brand" className="mt-6" onClick={startScenario}>
          Start scenario
        </Button>
      </div>
    );
  }

  if (phase === 'summary') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[3px] text-redex-red">Scenario complete</p>
        <div className="prose mt-4 max-w-none text-slate-700">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
            {content.outcome_summary_markdown?.trim() ||
              'Scenario complete. Review your decisions with your manager or trainer if needed.'}
          </ReactMarkdown>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-redex-offwhite p-4">
          <p className="text-xs font-semibold uppercase tracking-[2px] text-slate-500">Decision recap</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {visitedStepIds.map((stepId) => {
              const step = steps.find((item) => item.id === stepId);
              const choiceId = selectedChoiceIds[stepId];
              const choiceLabel = step?.choices.find((item) => item.id === choiceId)?.label;

              return (
                <li key={stepId}>
                  {step?.prompt_markdown ?? 'Step'}: {choiceLabel ?? 'No recorded choice'}
                </li>
              );
            })}
          </ul>
        </div>

        <Button
          type="button"
          variant="brand"
          className="mt-6 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          onClick={completeScenario}
          disabled={isCompleted}
        >
          {isCompleted ? 'Scenario completed' : 'Complete scenario'}
        </Button>
      </div>
    );
  }

  if (!currentStep || currentStep.choices.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[3px] text-amber-700">Scenario step unavailable</p>
        <p className="mt-3 text-sm text-amber-900">This scenario step does not have valid choices configured yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[3px] text-redex-red">Scenario decision</p>
      <div className="prose mt-4 max-w-none text-slate-700">
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{currentStep.prompt_markdown}</ReactMarkdown>
      </div>

      <div className="mt-6 space-y-3">
        {currentStep.choices.map((choice) => (
          <ScenarioChoiceCard
            key={choice.id}
            choice={choice}
            isSelected={selectedChoiceId === choice.id}
            isDisabled={selectedChoiceId !== null}
            showFeedbackState={selectedChoiceId !== null}
            onSelect={() => selectChoice(choice.id)}
          />
        ))}
      </div>

      {selectedChoice ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-redex-offwhite p-4">
          <div className="prose max-w-none text-sm text-slate-700" role="status" aria-live="polite">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{normalizeFeedback(selectedChoice)}</ReactMarkdown>
          </div>

          {selectedChoice.is_correct === false && !selectedChoice.next_step_id ? (
            <Button type="button" variant="brand" className="mt-4" onClick={handleRetryChoice}>
              Try another choice
            </Button>
          ) : (
            <Button type="button" variant="brand" className="mt-4" onClick={handleContinue}>
              Continue
            </Button>
          )}
        </div>
      ) : null}

      {configurationError ? <p className="mt-4 text-sm font-medium text-amber-700">{configurationError}</p> : null}
    </div>
  );
}
