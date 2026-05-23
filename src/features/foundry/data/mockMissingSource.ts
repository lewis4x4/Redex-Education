import type { PublishBlocker } from '@/lib/education';

export const MOCK_MISSING_SOURCE_TEXTS: string[] = [
  'All managers must complete this by Friday. [PLACEHOLDER] Insert approved policy excerpt from HR handbook.',
  'Safety briefing draft: [TODO] Replace with approved lockout/tagout language from source manual.',
  'Customer escalation script v0: [FIXME] Verify legal disclaimer wording with Compliance before publish.',
  '⚠️ MISSING SOURCE — Admin must provide approved content before publishing.',
];

export const MOCK_PUBLISH_BLOCKERS: PublishBlocker[] = [
  {
    id: 'source-placeholder-section-1',
    source: 'source_placeholder',
    severity: 'blocker',
    location: 'Source section: Employee onboarding policy',
    summary: 'Source section contains placeholder content that must be resolved.',
    detail: 'Contains [PLACEHOLDER] token in required policy language.',
    resolve_route: '/admin/foundry/source',
  },
  {
    id: 'source-placeholder-section-2',
    source: 'source_placeholder',
    severity: 'blocker',
    location: 'Source section: Safety PPE requirements',
    summary: 'Source section contains placeholder content that must be resolved.',
    detail: 'Contains [FIXME] token pending approved safety copy.',
    resolve_route: '/admin/foundry/source',
  },
  {
    id: 'critique-issue-1',
    source: 'critique_high_severity',
    severity: 'blocker',
    location: 'Lesson: Incident reporting basics',
    summary: 'High-severity critique issue must be resolved before publish.',
    detail: 'Generated step references an unsupported escalation policy.',
    resolve_route: '/admin/foundry/critique',
  },
  {
    id: 'lesson-unsupported-2-0',
    source: 'lesson_unsupported_claim',
    severity: 'blocker',
    location: 'Lesson: Hazard communication overview',
    summary: 'Lesson has an unsupported claim pending resolution.',
    detail: 'Claim references an unverified OSHA threshold not present in source.',
    resolve_route: '/admin/foundry/sidebyside',
  },
];
