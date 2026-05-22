import { CRITICALITY_OPTIONS } from '@/features/foundry/data/setupQuestions';
import type { WizardCriticality } from '@/lib/education';

export interface CriticalitySelectorProps {
  value: WizardCriticality;
  onChange: (next: WizardCriticality) => void;
}

export function CriticalitySelector({ value, onChange }: CriticalitySelectorProps) {
  const selectedOption =
    CRITICALITY_OPTIONS.find((option) => option.value === value) ?? CRITICALITY_OPTIONS[0];

  if (!selectedOption) {
    return null;
  }

  const isHighRisk = selectedOption.value === 'compliance_high_risk';

  return (
    <fieldset className="space-y-3" role="radiogroup">
      <legend className="block text-sm font-medium text-slate-900">Criticality</legend>
      <div className="space-y-2">
        {CRITICALITY_OPTIONS.map((option) => {
          const isSelected = option.value === value;

          return (
            <label
              key={option.value}
              htmlFor={`criticality-${option.value}`}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <input
                id={`criticality-${option.value}`}
                type="radio"
                name="criticality"
                value={option.value}
                checked={isSelected}
                aria-checked={isSelected}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 border-slate-300 text-redex-red focus:ring-redex-red"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      <div
        aria-live="polite"
        className={
          isHighRisk
            ? 'rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm'
            : 'rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm'
        }
      >
        {selectedOption.helperText}
      </div>
    </fieldset>
  );
}
