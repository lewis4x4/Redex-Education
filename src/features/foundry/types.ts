import type { CanonicalAudience, LearningOutcome, TrainingType } from '@/lib/education';

/**
 * Working draft of the basics step. Persisted via Zustand
 * (localStorage) and consumed by every subsequent foundry slice
 * (source binder, setup questions, outline review, etc.).
 */
export interface ModuleBasicsDraft {
  /** Optional module version id when editing a forked published version. */
  id?: string;
  /** Optional module id when editing a forked published version. */
  module_id?: string;
  /** Optional version number when editing a forked published version. */
  version_number?: number;
  /** Optional source binder version retained when editing a forked published version. */
  source_binder_version?: string;
  /** Optional assessment version retained when editing a forked published version. */
  assessment_version?: string;
  /** Supabase training_courses.id returned after draft creation in supabase mode. */
  persisted_course_id?: string;
  /** Supabase training_modules.id returned after outline persistence in supabase mode. */
  persisted_module_id?: string;
  /** Module title — required, 4-120 chars */
  title: string;
  /** 'standalone' or an existing course ID */
  parent_course_id: 'standalone' | string;
  /** Canonical audience archetype */
  audience_archetype?: CanonicalAudience;
  /** Optional admin-specific refinement shown alongside selected archetype. */
  audience_refinement?: string;
  /** Completion requirement for module consumers. */
  completion_required?: 'required' | 'recommended' | 'optional';
  /** One of the 7 canonical training types */
  training_type: TrainingType;
  /** Desired learning outcomes, 1-3 items. */
  learning_outcomes?: LearningOutcome[];
  /** @deprecated Temporary compatibility during parallel builder migration. */
  audience?: string;
  /** @deprecated Temporary compatibility during parallel builder migration. */
  criticality?: 'required' | 'optional';
  /** Target duration in minutes, 5-300 */
  estimated_minutes: number;
  /** When the draft was last saved (ISO timestamp) */
  updated_at: string;
}

/**
 * RHF form values — superset shape used during editing.
 * Identical to `ModuleBasicsDraft` minus `updated_at` (which the store sets).
 */
export type ModuleBasicsFormValues = Omit<ModuleBasicsDraft, 'updated_at'>;
