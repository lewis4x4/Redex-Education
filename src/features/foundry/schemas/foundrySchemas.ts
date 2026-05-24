import { z } from 'zod';
import { CANONICAL_AUDIENCES } from '@/lib/education';
import type { SetupAnswers } from '@/lib/education';
import type { ModuleBasicsFormValues } from '../types';

export const TRAINING_TYPE_VALUES = [
  'hr',
  'operational',
  'safety',
  'compliance',
  'customer_specific',
  'role_specific',
  'general_informational',
] as const;

const learningOutcomeSchema = z.object({
  id: z.string().min(1),
  text: z
    .string()
    .min(8, 'Each outcome needs at least 8 characters')
    .max(180, 'Keep each outcome under 180 characters')
    .trim(),
});

export const moduleBasicsSchema = z.object({
  title: z
    .string()
    .min(4, 'Module title must be at least 4 characters')
    .max(120, 'Module title must be 120 characters or fewer')
    .trim(),
  parent_course_id: z.string().min(1, 'Choose a parent course or Standalone'),
  audience_archetype: z.enum(CANONICAL_AUDIENCES),
  audience_refinement: z
    .string()
    .max(80, 'Audience refinement must be 80 characters or fewer')
    .trim()
    .optional(),
  completion_required: z.enum(['required', 'recommended', 'optional']),
  training_type: z.enum(TRAINING_TYPE_VALUES),
  learning_outcomes: z
    .array(learningOutcomeSchema)
    .min(1, 'Add at least one learning outcome')
    .max(3, 'Maximum 3 learning outcomes'),
  estimated_minutes: z
    .number({ message: 'Enter a target duration in minutes' })
    .int('Whole minutes only')
    .min(5, 'Minimum 5 minutes')
    .max(300, 'Maximum 300 minutes'),
}) satisfies z.ZodType<ModuleBasicsFormValues>;

export type ModuleBasicsSchemaInput = z.infer<typeof moduleBasicsSchema>;

export const wizardCriticalityValues = [
  'informational',
  'basic_knowledge',
  'operational',
  'compliance_high_risk',
] as const;

export const assessmentStyleValues = [
  'no_assessment',
  'light_quiz',
  'standard_quiz',
  'strict_quiz',
  'scenario_based',
  'acknowledgment_only',
] as const;

export const setupAnswersSchema = z.object({
  criticality: z.enum(wizardCriticalityValues),
  assessment_style: z.enum(assessmentStyleValues),
  audience_notes: z
    .string()
    .min(2, 'Add a target audience')
    .max(280, 'Audience notes must be 280 characters or fewer')
    .trim(),
  experience_notes: z
    .string()
    .max(280, 'Experience notes must be 280 characters or fewer')
    .trim(),
  estimated_minutes: z
    .number({ message: 'Enter a target duration in minutes' })
    .int('Whole minutes only')
    .min(5, 'Minimum 5 minutes')
    .max(300, 'Maximum 300 minutes'),
  source_control: z.enum(['strict', 'flexible']),
  requires_admin_approval: z.boolean(),
  requires_safety_review: z.boolean(),
}) satisfies z.ZodType<Omit<SetupAnswers, 'updated_at'>>;

export type SetupAnswersInput = z.infer<typeof setupAnswersSchema>;
