import type { AssessmentStyle, WizardCriticality } from '@/lib/education';

export interface CriticalityOption {
  value: WizardCriticality;
  label: string;
  /** Helper text displayed when this option is selected. */
  helperText: string;
}

export const CRITICALITY_OPTIONS: CriticalityOption[] = [
  {
    value: 'informational',
    label: 'Informational',
    helperText:
      'Low-stakes content. AI may rephrase freely; no acknowledgment required.',
  },
  {
    value: 'basic_knowledge',
    label: 'Basic Knowledge',
    helperText:
      'Useful background. AI may rephrase but should stay close to source.',
  },
  {
    value: 'operational',
    label: 'Operational',
    helperText:
      'Day-to-day procedure. AI must stick close to source; review recommended.',
  },
  {
    value: 'compliance_high_risk',
    label: 'Compliance / Safety / High-Risk',
    helperText:
      'Strict source grounding. Placeholder sections block publishing. Admin + safety reviewer approval required.',
  },
];

export const ASSESSMENT_OPTIONS: {
  value: AssessmentStyle;
  label: string;
  description: string;
}[] = [
  {
    value: 'no_assessment',
    label: 'No assessment',
    description: 'Read-only content.',
  },
  {
    value: 'light_quiz',
    label: 'Light quiz',
    description: '2-3 questions, low passing threshold.',
  },
  {
    value: 'standard_quiz',
    label: 'Standard quiz',
    description: '5-8 questions, 80% passing threshold.',
  },
  {
    value: 'strict_quiz',
    label: 'Strict quiz',
    description: '10+ questions, 90% passing threshold, retake limit.',
  },
  {
    value: 'scenario_based',
    label: 'Scenario-based assessment',
    description: 'Branching scenarios requiring judgment.',
  },
  {
    value: 'acknowledgment_only',
    label: 'Acknowledgment only',
    description: 'Single attestation, no grading.',
  },
];

export const QUESTION_GROUP_TITLES = [
  'Module identity',
  'Audience',
  'Training type',
  'Criticality',
  'Assessment style',
  'Experience style',
  'Timing',
  'Source control',
  'Approval requirements',
] as const;
