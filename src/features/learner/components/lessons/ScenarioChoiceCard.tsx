import type { ScenarioChoice } from '@/lib/education';
import { cn } from '@/lib/utils';

interface ScenarioChoiceCardProps {
  choice: ScenarioChoice;
  isSelected: boolean;
  isDisabled: boolean;
  showFeedbackState: boolean;
  onSelect: () => void;
}

function feedbackStateClass(choice: ScenarioChoice, isSelected: boolean) {
  if (!isSelected) {
    return 'border-slate-200 bg-white text-slate-800';
  }

  if (choice.is_correct === true) {
    return 'border-emerald-300 bg-emerald-50 text-emerald-900';
  }

  if (choice.is_correct === false) {
    return 'border-amber-300 bg-amber-50 text-amber-900';
  }

  return 'border-slate-300 bg-slate-50 text-slate-900';
}

export function ScenarioChoiceCard({
  choice,
  isSelected,
  isDisabled,
  showFeedbackState,
  onSelect,
}: ScenarioChoiceCardProps) {
  const stateClass = showFeedbackState
    ? feedbackStateClass(choice, isSelected)
    : 'border-slate-200 bg-white text-slate-800 hover:border-redex-red/40 hover:bg-redex-offwhite';

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      className={cn(
        'w-full rounded-xl border p-4 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-80',
        stateClass,
      )}
    >
      {choice.label}
    </button>
  );
}
