import { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  CANONICAL_AUDIENCE_LABELS,
  CANONICAL_AUDIENCES,
  TRAINING_TYPE_LABELS,
} from '@/lib/education';
import { moduleBasicsSchema, TRAINING_TYPE_VALUES } from '../schemas/foundrySchemas';
import type { ModuleBasicsFormValues } from '../types';

export interface ModuleBasicsFormProps {
  initialValues?: Partial<ModuleBasicsFormValues>;
  onSubmit: (values: ModuleBasicsFormValues) => void;
  parentCourseOptions: ReadonlyArray<{
    id: 'standalone' | string;
    label: string;
  }>;
  onCancel?: () => void;
}

function createLearningOutcome() {
  return {
    id: `outcome-${Math.random().toString(36).slice(2, 10)}`,
    text: '',
  };
}

const defaultValues: ModuleBasicsFormValues = {
  title: '',
  parent_course_id: 'standalone',
  audience_archetype: 'new_hire',
  audience_refinement: '',
  completion_required: 'recommended',
  training_type: 'general_informational',
  learning_outcomes: [createLearningOutcome()],
  estimated_minutes: 30,
};

const whyWeAsk: Record<string, string> = {
  title: 'This title appears in admin workflows and learner assignments.',
  parent_course_id: 'Parent course controls where this module is grouped in reporting.',
  audience_archetype: 'Audience helps tailor tone and examples in generated content.',
  audience_refinement: 'Refinement captures team-specific nuance for better AI grounding.',
  learning_outcomes: 'Outcomes keep every generated lesson focused on practical learner results.',
  completion_required: 'Completion requirement sets how strongly this module should be enforced.',
  training_type: 'Training type calibrates structure and compliance posture.',
  estimated_minutes: 'Duration helps pacing and expectation-setting for learners.',
};

const durationPresets = [15, 30, 60, 90] as const;

export function ModuleBasicsForm({ initialValues, onSubmit, parentCourseOptions, onCancel }: ModuleBasicsFormProps) {
  const [openHelp, setOpenHelp] = useState<Record<string, boolean>>({});
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<ModuleBasicsFormValues>({
    resolver: zodResolver(moduleBasicsSchema),
    defaultValues: {
      ...defaultValues,
      ...initialValues,
      learning_outcomes: initialValues?.learning_outcomes?.length
        ? initialValues.learning_outcomes
        : defaultValues.learning_outcomes,
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'learning_outcomes',
  });

  const estimatedMinutes = useWatch({ control, name: 'estimated_minutes' });
  const isCustomDuration = !durationPresets.includes(estimatedMinutes as (typeof durationPresets)[number]);

  function toggleHelp(key: string) {
    setOpenHelp((previous) => ({ ...previous, [key]: !previous[key] }));
  }

  function renderWhyWeAsk(key: string) {
    return (
      <>
        <button
          type="button"
          aria-label="Why we ask"
          aria-expanded={openHelp[key] ? 'true' : 'false'}
          className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600"
          onClick={() => toggleHelp(key)}
        >
          ?
        </button>
        {openHelp[key] ? <p className="mt-1 text-xs text-slate-500">{whyWeAsk[key]}</p> : null}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <form aria-label="Module basics" className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900" htmlFor="title">
            Module title <span aria-hidden="true">*</span>
          </label>
          {renderWhyWeAsk('title')}
          <input
            id="title"
            type="text"
            placeholder="e.g. Field Safety Refresher"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red"
            aria-invalid={errors.title ? 'true' : 'false'}
            aria-describedby={errors.title ? 'title-error' : undefined}
            {...register('title')}
          />
          <p id="title-error" aria-live="polite" className="text-sm text-red-600">
            {errors.title?.message ?? '\u00a0'}
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900" htmlFor="parent_course_id">
            Parent course <span aria-hidden="true">*</span>
          </label>
          {renderWhyWeAsk('parent_course_id')}
          <select
            id="parent_course_id"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red"
            aria-invalid={errors.parent_course_id ? 'true' : 'false'}
            aria-describedby={errors.parent_course_id ? 'parent_course_id-error' : undefined}
            {...register('parent_course_id')}
          >
            {parentCourseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {course.label}
              </option>
            ))}
          </select>
          <p id="parent_course_id-error" aria-live="polite" className="text-sm text-red-600">
            {errors.parent_course_id?.message ?? '\u00a0'}
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900" htmlFor="audience_archetype">
            Audience <span aria-hidden="true">*</span>
          </label>
          {renderWhyWeAsk('audience_archetype')}
          <select
            id="audience_archetype"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red"
            aria-invalid={errors.audience_archetype ? 'true' : 'false'}
            aria-describedby={errors.audience_archetype ? 'audience_archetype-error' : undefined}
            {...register('audience_archetype')}
          >
            {CANONICAL_AUDIENCES.map((audience) => (
              <option key={audience} value={audience}>
                {CANONICAL_AUDIENCE_LABELS[audience]}
              </option>
            ))}
          </select>
          <p id="audience_archetype-error" aria-live="polite" className="text-sm text-red-600">
            {errors.audience_archetype?.message ?? '\u00a0'}
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900" htmlFor="audience_refinement">
            Audience refinement
          </label>
          {renderWhyWeAsk('audience_refinement')}
          <input
            id="audience_refinement"
            type="text"
            placeholder="e.g. North America call center team"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red"
            aria-invalid={errors.audience_refinement ? 'true' : 'false'}
            aria-describedby={errors.audience_refinement ? 'audience_refinement-error' : undefined}
            {...register('audience_refinement')}
          />
          <p id="audience_refinement-error" aria-live="polite" className="text-sm text-red-600">
            {errors.audience_refinement?.message ?? '\u00a0'}
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="block text-sm font-medium text-slate-900">
            Learning outcomes <span aria-hidden="true">*</span>
          </legend>
          {renderWhyWeAsk('learning_outcomes')}
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="hidden"
                    defaultValue={field.id}
                    {...register(`learning_outcomes.${index}.id`)}
                  />
                  <input
                    id={`learning_outcomes.${index}.text`}
                    type="text"
                    placeholder="Describe a concrete post-training capability"
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red"
                    aria-invalid={errors.learning_outcomes?.[index]?.text ? 'true' : 'false'}
                    {...register(`learning_outcomes.${index}.text` as const)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                    aria-label={`Remove learning outcome ${index + 1}`}
                  >
                    Remove
                  </Button>
                </div>
                <p aria-live="polite" className="text-sm text-red-600">
                  {errors.learning_outcomes?.[index]?.text?.message ?? '\u00a0'}
                </p>
              </div>
            ))}
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              disabled={fields.length >= 3}
              onClick={() => append(createLearningOutcome())}
            >
              Add outcome
            </Button>
            <p aria-live="polite" className="text-sm text-red-600">
              {typeof errors.learning_outcomes?.message === 'string' ? errors.learning_outcomes.message : '\u00a0'}
            </p>
          </div>
        </fieldset>

        <fieldset className="space-y-2" role="radiogroup" aria-describedby={errors.completion_required ? 'completion_required-error' : undefined}>
          <legend className="block text-sm font-medium text-slate-900">
            Completion requirement <span aria-hidden="true">*</span>
          </legend>
          {renderWhyWeAsk('completion_required')}
          <div className="flex flex-wrap gap-5">
            {(['required', 'recommended', 'optional'] as const).map((value) => (
              <label key={value} className="inline-flex items-center gap-2 text-sm text-slate-900" htmlFor={`completion-${value}`}>
                <input
                  id={`completion-${value}`}
                  type="radio"
                  value={value}
                  className="h-4 w-4 border-slate-300 text-redex-red focus:ring-redex-red"
                  aria-invalid={errors.completion_required ? 'true' : 'false'}
                  {...register('completion_required')}
                />
                {value[0]?.toUpperCase() + value.slice(1)}
              </label>
            ))}
          </div>
          <p id="completion_required-error" aria-live="polite" className="text-sm text-red-600">
            {errors.completion_required?.message ?? '\u00a0'}
          </p>
        </fieldset>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900" htmlFor="training_type">
            Training type <span aria-hidden="true">*</span>
          </label>
          {renderWhyWeAsk('training_type')}
          <select
            id="training_type"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red"
            aria-invalid={errors.training_type ? 'true' : 'false'}
            aria-describedby={errors.training_type ? 'training_type-error' : undefined}
            {...register('training_type')}
          >
            {TRAINING_TYPE_VALUES.map((trainingType) => (
              <option key={trainingType} value={trainingType}>
                {TRAINING_TYPE_LABELS[trainingType]}
              </option>
            ))}
          </select>
          <p id="training_type-error" aria-live="polite" className="text-sm text-red-600">
            {errors.training_type?.message ?? '\u00a0'}
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900" htmlFor="estimated_minutes">
            Estimated duration target <span aria-hidden="true">*</span>
          </label>
          {renderWhyWeAsk('estimated_minutes')}
          <div className="flex flex-wrap gap-2">
            {durationPresets.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={estimatedMinutes === preset ? 'brand' : 'outline'}
                onClick={() => setValue('estimated_minutes', preset, { shouldValidate: true, shouldDirty: true })}
              >
                {preset} min
              </Button>
            ))}
            <Button
              type="button"
              variant={isCustomDuration ? 'brand' : 'outline'}
              onClick={() => {
                if (!isCustomDuration) {
                  setValue('estimated_minutes', 5, { shouldValidate: true, shouldDirty: true });
                }
              }}
            >
              Custom
            </Button>
          </div>
          {isCustomDuration || !durationPresets.includes(estimatedMinutes as (typeof durationPresets)[number]) ? (
            <div className="flex items-center gap-2">
              <input
                id="estimated_minutes"
                type="number"
                min={5}
                max={300}
                step={5}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red"
                aria-invalid={errors.estimated_minutes ? 'true' : 'false'}
                aria-describedby={errors.estimated_minutes ? 'estimated_minutes-error' : undefined}
                {...register('estimated_minutes', { valueAsNumber: true })}
              />
              <span className="text-sm text-slate-600">min</span>
            </div>
          ) : null}
          <p id="estimated_minutes-error" aria-live="polite" className="text-sm text-red-600">
            {errors.estimated_minutes?.message ?? '\u00a0'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" variant="brand" disabled={!isValid} className="disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
            Continue → Add source material
          </Button>
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
