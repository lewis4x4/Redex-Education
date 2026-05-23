import type { PublishBlocker } from '@/lib/education';

export const MOCK_MISSING_SOURCE_TEXTS: string[] = [
  'All managers must complete this by Friday. [PLACEHOLDER] Insert approved policy excerpt from HR handbook.',
  'Safety briefing draft: [TODO] Replace with approved lockout/tagout language from source manual.',
  'Customer escalation script v0: [FIXME] Verify legal disclaimer wording with Compliance before publish.',
  '⚠️ MISSING SOURCE — Admin must provide approved content before publishing.',
];

export const MOCK_PUBLISH_BLOCKERS: PublishBlocker[] = [
  {
    id: 'source-placeholder-payroll-timekeeping',
    source: 'source_placeholder',
    severity: 'blocker',
    location: 'Source section: Payroll basics',
    summary: 'Source section contains placeholder content that must be resolved.',
    detail: '[PLACEHOLDER — Redex must provide approved payroll/timekeeping policy language]',
    resolve_route: '/admin/foundry/source',
  },
  {
    id: 'source-placeholder-manager-escalation',
    source: 'source_placeholder',
    severity: 'blocker',
    location: 'Source section: Manager escalation path',
    summary: 'Source section contains placeholder content that must be resolved.',
    detail: '[PLACEHOLDER — Redex must provide approved escalation-path policy language]',
    resolve_route: '/admin/foundry/source',
  },
  {
    id: 'lesson-unsupported-payroll-timekeeping',
    source: 'lesson_unsupported_claim',
    severity: 'blocker',
    location: 'Lesson: Payroll and Timekeeping Basics',
    summary: 'Lesson has an unsupported claim pending resolution.',
    detail:
      'Payroll and timekeeping policy language is placeholder-only and cannot support final claims until People Ops provides approved source text.',
    resolve_route: '/admin/foundry/sidebyside',
  },
];
