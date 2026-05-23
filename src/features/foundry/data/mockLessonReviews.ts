import type { LessonReviewItem } from '@/lib/education';

export const MOCK_LESSON_REVIEWS: LessonReviewItem[] = [
  {
    lesson_index: 0,
    module_index: 0,
    lesson_title: 'Welcome to Redex',
    confidence: 'high',
    has_unsupported_claim: false,
    status: 'approved',
    source_excerpts: [
      {
        drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7',
        source_title: 'code-of-conduct.md',
        section_heading: 'Welcome to Redex',
        section_body:
          'Your first week is about getting set up, meeting the people who will support you, and learning where to find what you need.',
      },
    ],
  },
  {
    lesson_index: 1,
    module_index: 0,
    lesson_title: 'Who to Contact for HR Help',
    confidence: 'high',
    has_unsupported_claim: false,
    status: 'approved',
    source_excerpts: [
      {
        drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7',
        source_title: 'code-of-conduct.md',
        section_heading: 'Who to contact for HR help',
        section_body:
          'Primary contact: People Ops team — peopleops@redex.example. Onboarding buddy: Sarah Chen — sarah.chen@redex.example.',
      },
    ],
  },
  {
    lesson_index: 2,
    module_index: 0,
    lesson_title: 'Payroll and Timekeeping Basics',
    confidence: 'unsupported',
    has_unsupported_claim: true,
    unsupported_note:
      'Payroll/timekeeping policy language is placeholder-only and cannot support final claims until People Ops provides approved source text.',
    status: 'pending',
    source_excerpts: [
      {
        drive_file_id: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R',
        source_title: 'pto-policy.md',
        section_heading: 'Payroll basics',
        section_body: '[PLACEHOLDER — Redex must provide approved policy language]',
      },
      {
        drive_file_id: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R',
        source_title: 'pto-policy.md',
        section_heading: 'Timekeeping expectations',
        section_body: '[PLACEHOLDER — Redex must provide approved policy language]',
      },
    ],
  },
  {
    lesson_index: 3,
    module_index: 0,
    lesson_title: 'First-Week Expectations',
    confidence: 'medium',
    has_unsupported_claim: false,
    status: 'pending',
    source_excerpts: [
      {
        drive_file_id: '1wgolsCH2BOX5ZLICM05AtZLYqtiHsiEr',
        source_title: 'new-hire-checklist.md',
        section_heading: 'First-week expectations',
        section_body:
          'Complete I-9, meet your manager and buddy, submit first timesheet, and schedule a 30-day check-in.',
      },
    ],
  },
  {
    lesson_index: 4,
    module_index: 0,
    lesson_title: 'Required Acknowledgment',
    confidence: 'medium',
    has_unsupported_claim: false,
    status: 'pending',
    source_excerpts: [
      {
        drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7',
        source_title: 'code-of-conduct.md',
        section_heading: 'Communication expectations',
        section_body:
          'Use in-person or video for sensitive conversations. No expectation of after-hours responses unless it is an emergency.',
      },
      {
        drive_file_id: '1wgolsCH2BOX5ZLICM05AtZLYqtiHsiEr',
        source_title: 'new-hire-checklist.md',
        section_heading: 'Manager escalation path',
        section_body: '[PLACEHOLDER — Redex must provide approved policy language]',
      },
    ],
  },
  {
    lesson_index: 5,
    module_index: 0,
    lesson_title: 'Final Quiz',
    confidence: 'high',
    has_unsupported_claim: false,
    status: 'pending',
    source_excerpts: [
      {
        drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7',
        source_title: 'code-of-conduct.md',
        section_heading: 'Who to contact for HR help',
        section_body:
          'People Ops + onboarding buddy + manager paths are defined for first-week support and escalation.',
      },
      {
        drive_file_id: '1wgolsCH2BOX5ZLICM05AtZLYqtiHsiEr',
        source_title: 'new-hire-checklist.md',
        section_heading: 'First-week expectations',
        section_body:
          'First-week checklist includes I-9, first timesheet, and scheduling a 30-day check-in.',
      },
    ],
  },
];
