import { useState } from 'react';
import { useForm, useWatch, Controller, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { setupAnswersSchema, type SetupAnswersInput } from '../schemas/foundrySchemas';
import { CriticalitySelector } from './CriticalitySelector';
import { AssessmentConfigPanel } from './AssessmentConfigPanel';

export interface QuestionWizardProps {
  initialValues?: Partial<SetupAnswersInput>;
  onSubmit: (values: SetupAnswersInput) => void;
  onCancel?: () => void;
}

const sensibleDefaults: SetupAnswersInput = {
  criticality: 'basic_knowledge',
  assessment_style: 'light_quiz',
  audience_notes: '',
  experience_notes: '',
  estimated_minutes: 20,
  source_control: 'strict',
  requires_admin_approval: true,
  requires_safety_review: false,
};

const STEP_FIELDS: ReadonlyArray<FieldPath<SetupAnswersInput>[]> = [
  ['audience_notes'],
  ['criticality'],
  ['assessment_style'],
  ['experience_notes', 'estimated_minutes'],
  ['source_control'],
  ['requires_admin_approval', 'requires_safety_review'],
];

const TOTAL_STEPS = 6;

export function QuestionWizard({ initialValues, onSubmit, onCancel }: QuestionWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<SetupAnswersInput>({
    resolver: zodResolver(setupAnswersSchema),
    mode: 'onBlur',
    defaultValues: {
      ...sensibleDefaults,
      ...initialValues,
    },
  });

  const criticality = useWatch({ control, name: 'criticality' });
  const sourceControl = useWatch({ control, name: 'source_control' });
  const stepPercent = (currentStep / TOTAL_STEPS) * 100;

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[currentStep - 1]);
    if (!valid) return;
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 space-y-2">
        <p className="text-sm font-medium text-slate-700">
          Step {currentStep} of {TOTAL_STEPS}
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
          <div className="h-full bg-redex-red transition-all" style={{ width: `${stepPercent}%` }} />
        </div>
      </div>

      <form aria-label="Setup questions wizard" className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {currentStep === 1 ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Identity & Audience</h2>
            <label className="block text-sm font-medium text-slate-900" htmlFor="audience_notes">
              Audience notes
            </label>
            <textarea
              id="audience_notes"
              maxLength={280}
              rows={4}
              placeholder="Who is this training for?"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red"
              aria-invalid={errors.audience_notes ? 'true' : 'false'}
              aria-describedby={errors.audience_notes ? 'audience_notes-error' : 'audience_notes-help'}
              {...register('audience_notes')}
            />
            <p id="audience_notes-help" className="text-xs text-slate-500">
              Max 280 characters.
            </p>
            <p id="audience_notes-error" aria-live="polite" className="text-sm text-red-600">
              {errors.audience_notes?.message ?? '\u00a0'}
            </p>
          </section>
        ) : null}

        {currentStep === 2 ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Training type & Criticality</h2>
            <Controller
              control={control}
              name="criticality"
              render={({ field }) => (
                <CriticalitySelector value={field.value} onChange={field.onChange} />
              )}
            />
            <p aria-live="polite" className="text-sm text-red-600">
              {errors.criticality?.message ?? '\u00a0'}
            </p>
          </section>
        ) : null}

        {currentStep === 3 ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Assessment</h2>
            <Controller
              control={control}
              name="assessment_style"
              render={({ field }) => (
                <AssessmentConfigPanel value={field.value} onChange={field.onChange} />
              )}
            />
            <p aria-live="polite" className="text-sm text-red-600">
              {errors.assessment_style?.message ?? '\u00a0'}
            </p>
          </section>
        ) : null}

        {currentStep === 4 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Experience & Timing</h2>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-900" htmlFor="experience_notes">
                Experience notes
              </label>
              <textarea
                id="experience_notes"
                maxLength={280}
                rows={4}
                placeholder="How should this feel for the learner?"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red"
                aria-invalid={errors.experience_notes ? 'true' : 'false'}
                aria-describedby={errors.experience_notes ? 'experience_notes-error' : 'experience_notes-help'}
                {...register('experience_notes')}
              />
              <p id="experience_notes-help" className="text-xs text-slate-500">
                Max 280 characters.
              </p>
              <p id="experience_notes-error" aria-live="polite" className="text-sm text-red-600">
                {errors.experience_notes?.message ?? '\u00a0'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-900" htmlFor="estimated_minutes">
                Estimated minutes
              </label>
              <input
                id="estimated_minutes"
                type="number"
                min={5}
                max={300}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red"
                aria-invalid={errors.estimated_minutes ? 'true' : 'false'}
                aria-describedby={errors.estimated_minutes ? 'estimated_minutes-error' : 'estimated_minutes-help'}
                {...register('estimated_minutes', { valueAsNumber: true })}
              />
              <p id="estimated_minutes-help" className="text-xs text-slate-500">
                Enter 5 to 300 minutes.
              </p>
              <p id="estimated_minutes-error" aria-live="polite" className="text-sm text-red-600">
                {errors.estimated_minutes?.message ?? '\u00a0'}
              </p>
            </div>
          </section>
        ) : null}

        {currentStep === 5 ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Source control</h2>
            <fieldset className="space-y-2" role="radiogroup">
              <legend className="sr-only">Source control mode</legend>
              <label
                htmlFor="source_control-strict"
                className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <input
                    id="source_control-strict"
                    type="radio"
                    value="strict"
                    aria-checked={sourceControl === 'strict'}
                    className="mt-0.5 h-4 w-4 border-slate-300 text-redex-red focus:ring-redex-red"
                    {...register('source_control')}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Strict</p>
                    <p className="text-xs text-slate-600">
                      AI must stick closely to source text with no added inference.
                    </p>
                  </div>
                </div>
              </label>

              <label
                htmlFor="source_control-flexible"
                className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <input
                    id="source_control-flexible"
                    type="radio"
                    value="flexible"
                    aria-checked={sourceControl === 'flexible'}
                    className="mt-0.5 h-4 w-4 border-slate-300 text-redex-red focus:ring-redex-red"
                    {...register('source_control')}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Flexible</p>
                    <p className="text-xs text-slate-600">
                      AI may rephrase and simplify as long as source meaning remains intact.
                    </p>
                  </div>
                </div>
              </label>
            </fieldset>
            <p aria-live="polite" className="text-sm text-red-600">
              {errors.source_control?.message ?? '\u00a0'}
            </p>
          </section>
        ) : null}

        {currentStep === 6 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Approval</h2>
            <label htmlFor="requires_admin_approval" className="flex items-start gap-2 text-sm text-slate-900">
              <input
                id="requires_admin_approval"
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-redex-red focus:ring-redex-red"
                {...register('requires_admin_approval')}
              />
              <span>Requires admin approval before publishing</span>
            </label>
            <label htmlFor="requires_safety_review" className="flex items-start gap-2 text-sm text-slate-900">
              <input
                id="requires_safety_review"
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-redex-red focus:ring-redex-red"
                {...register('requires_safety_review')}
              />
              <span>Requires safety review</span>
            </label>
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 shadow-sm">
              Safety review becomes mandatory when criticality is Compliance / Safety / High-Risk.
              {criticality === 'compliance_high_risk'
                ? ' This module is currently high-risk.'
                : ''}
            </p>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handlePrev} disabled={currentStep === 1}>
            Prev
          </Button>

          {currentStep < TOTAL_STEPS ? (
            <Button type="button" onClick={handleNext} className="bg-redex-red text-white hover:bg-redex-red-hover">
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-redex-red text-white hover:bg-redex-red-hover disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              Submit
            </Button>
          )}

          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
