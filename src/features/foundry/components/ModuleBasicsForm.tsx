import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { TRAINING_TYPE_LABELS } from '@/lib/education';
import { moduleBasicsSchema, TRAINING_TYPE_VALUES } from '../schemas/foundrySchemas';
import type { ModuleBasicsFormValues } from '../types';

export interface ModuleBasicsFormProps {
  /**
   * Optional initial values for editing an existing draft. When provided,
   * RHF's defaultValues hydrate the form so admin can pick up where they
   * left off.
   */
  initialValues?: Partial<ModuleBasicsFormValues>;
  /**
   * Called with validated form data when the admin submits.
   * The page wires this to the Zustand store + navigation.
   */
  onSubmit: (values: ModuleBasicsFormValues) => void;
  /**
   * Course options for the parent-course select.
   * Always includes a synthetic 'standalone' option at the top.
   */
  parentCourseOptions: ReadonlyArray<{
    id: 'standalone' | string;
    label: string;
  }>;
  /**
   * Optional cancel handler — when provided, shows a secondary
   * "Cancel" button next to the primary CTA.
   */
  onCancel?: () => void;
}

const defaultValues: ModuleBasicsFormValues = {
  title: '',
  parent_course_id: 'standalone',
  audience: '',
  criticality: 'required',
  training_type: 'general_informational',
  estimated_minutes: 20,
};

export function ModuleBasicsForm({
  initialValues,
  onSubmit,
  parentCourseOptions,
  onCancel,
}: ModuleBasicsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ModuleBasicsFormValues>({
    resolver: zodResolver(moduleBasicsSchema),
    defaultValues: {
      ...defaultValues,
      ...initialValues,
    },
    mode: 'onChange',
  });

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm md:p-8">
      <form aria-label="Module basics" className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900" htmlFor="title">
            Module title <span aria-hidden="true">*</span>
          </label>
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
          <label className="block text-sm font-medium text-slate-900" htmlFor="audience">
            Audience <span aria-hidden="true">*</span>
          </label>
          <input
            id="audience"
            type="text"
            placeholder="e.g. New hires"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red"
            aria-invalid={errors.audience ? 'true' : 'false'}
            aria-describedby={errors.audience ? 'audience-help audience-error' : 'audience-help'}
            {...register('audience')}
          />
          <p id="audience-help" className="text-xs text-slate-500">
            Examples: New hires · All employees · Field team · Managers
          </p>
          <p id="audience-error" aria-live="polite" className="text-sm text-red-600">
            {errors.audience?.message ?? '\u00a0'}
          </p>
        </div>

        <fieldset className="space-y-2" role="radiogroup" aria-describedby={errors.criticality ? 'criticality-error' : undefined}>
          <legend className="block text-sm font-medium text-slate-900">
            Criticality <span aria-hidden="true">*</span>
          </legend>
          <div className="flex flex-wrap gap-5">
            <label className="inline-flex items-center gap-2 text-sm text-slate-900" htmlFor="criticality-required">
              <input
                id="criticality-required"
                type="radio"
                value="required"
                className="h-4 w-4 border-slate-300 text-redex-red focus:ring-redex-red"
                aria-invalid={errors.criticality ? 'true' : 'false'}
                aria-describedby={errors.criticality ? 'criticality-error' : undefined}
                {...register('criticality')}
              />
              Required
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-900" htmlFor="criticality-optional">
              <input
                id="criticality-optional"
                type="radio"
                value="optional"
                className="h-4 w-4 border-slate-300 text-redex-red focus:ring-redex-red"
                aria-invalid={errors.criticality ? 'true' : 'false'}
                aria-describedby={errors.criticality ? 'criticality-error' : undefined}
                {...register('criticality')}
              />
              Optional
            </label>
          </div>
          <p id="criticality-error" aria-live="polite" className="text-sm text-red-600">
            {errors.criticality?.message ?? '\u00a0'}
          </p>
        </fieldset>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900" htmlFor="training_type">
            Training type <span aria-hidden="true">*</span>
          </label>
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
          <p id="estimated_minutes-error" aria-live="polite" className="text-sm text-red-600">
            {errors.estimated_minutes?.message ?? '\u00a0'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="submit"
            disabled={!isValid}
            className="bg-redex-red text-white hover:bg-redex-red-hover disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
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
