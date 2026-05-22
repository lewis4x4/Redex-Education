import { ASSESSMENT_OPTIONS } from '@/features/foundry/data/setupQuestions';
import type { AssessmentStyle } from '@/lib/education';

export interface AssessmentConfigPanelProps {
  value: AssessmentStyle;
  onChange: (next: AssessmentStyle) => void;
}

export function AssessmentConfigPanel({ value, onChange }: AssessmentConfigPanelProps) {
  return (
    <fieldset className="space-y-3" role="radiogroup">
      <legend className="block text-sm font-medium text-slate-900">Assessment style</legend>
      <div className="grid gap-3 md:grid-cols-2">
        {ASSESSMENT_OPTIONS.map((option) => {
          const isSelected = option.value === value;

          return (
            <label
              key={option.value}
              htmlFor={`assessment-${option.value}`}
              className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition-colors ${
                isSelected
                  ? 'border-redex-red bg-redex-red/[0.04]'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                id={`assessment-${option.value}`}
                type="radio"
                name="assessment_style"
                value={option.value}
                checked={isSelected}
                aria-checked={isSelected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                <p className="text-xs text-slate-600">{option.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
