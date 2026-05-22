import { z } from 'zod';
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

export const moduleBasicsSchema = z.object({
  title: z
    .string()
    .min(4, 'Module title must be at least 4 characters')
    .max(120, 'Module title must be 120 characters or fewer')
    .trim(),
  parent_course_id: z.string().min(1, 'Choose a parent course or Standalone'),
  audience: z
    .string()
    .min(2, 'Add a target audience (e.g. "New hires")')
    .max(80, 'Audience must be 80 characters or fewer')
    .trim(),
  criticality: z.enum(['required', 'optional']),
  training_type: z.enum(TRAINING_TYPE_VALUES),
  estimated_minutes: z
    .number({ message: 'Enter a target duration in minutes' })
    .int('Whole minutes only')
    .min(5, 'Minimum 5 minutes')
    .max(300, 'Maximum 300 minutes'),
}) satisfies z.ZodType<ModuleBasicsFormValues>;

export type ModuleBasicsSchemaInput = z.infer<typeof moduleBasicsSchema>;
