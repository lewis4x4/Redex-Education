import type { GeneratedModulePreview } from '@/lib/education';
import { DEMO_HR_BASICS_QUIZ_QUESTIONS } from '@/lib/education';

export const MOCK_GENERATED_MODULE: GeneratedModulePreview = {
  module_title: 'HR Basics at Redex',
  lessons: [
    {
      lesson_index: 0,
      module_index: 0,
      title: 'Welcome to Redex',
      lesson_type: 'text',
      body_markdown:
        "Welcome to Redex. Your first week is about getting set up, meeting your support network, and learning where to find what you need. We don't expect memorization — we expect questions, notes, and early escalation when blocked.",
      status: 'ready_for_approval',
      source_refs: [{ drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7', section_count: 1 }],
    },
    {
      lesson_index: 1,
      module_index: 0,
      title: 'Who to Contact for HR Help',
      lesson_type: 'text',
      body_markdown:
        'People Ops is your first contact for HR questions. Primary contact: peopleops@redex.example. Your onboarding buddy is Sarah Chen. For urgent after-hours issues, contact your direct manager first, then follow up with People Ops within one business day.',
      status: 'ready_for_approval',
      source_refs: [{ drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7', section_count: 1 }],
    },
    {
      lesson_index: 2,
      module_index: 0,
      title: 'Payroll and Timekeeping Basics',
      lesson_type: 'text',
      body_markdown:
        '⚠️ Missing-source warning: payroll and timekeeping sections are currently placeholder-only in source. This preview can show workflow context, but policy language is not approved and must be replaced before publish.',
      status: 'missing_source',
      status_note:
        'Payroll basics + Timekeeping expectations source sections include [PLACEHOLDER] markers',
      source_refs: [{ drive_file_id: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R', section_count: 2 }],
    },
    {
      lesson_index: 3,
      module_index: 0,
      title: 'First-Week Expectations',
      lesson_type: 'text',
      body_markdown:
        'Week one baseline: complete I-9 and required forms, set up devices, meet your manager and onboarding buddy, submit your first timesheet, and schedule a 30-day check-in. If blocked, notify your manager or People Ops the same day.',
      status: 'ready_for_approval',
      source_refs: [{ drive_file_id: '1wgolsCH2BOX5ZLICM05AtZLYqtiHsiEr', section_count: 1 }],
    },
    {
      lesson_index: 4,
      module_index: 0,
      title: 'Required Acknowledgment',
      lesson_type: 'acknowledgment',
      acknowledgment_text:
        'I acknowledge that I have read and understood the HR Basics content covered so far, including communication norms and first-week expectations. I understand escalation policy details are pending approved source language and I should contact People Ops for current guidance.',
      status: 'draft',
      status_note:
        'Escalation-path language references placeholder source and requires HR/Legal-approved text before ready state',
      source_refs: [
        { drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7', section_count: 1 },
        { drive_file_id: '1wgolsCH2BOX5ZLICM05AtZLYqtiHsiEr', section_count: 1 },
      ],
    },
    {
      lesson_index: 5,
      module_index: 0,
      title: 'Final Quiz',
      lesson_type: 'quiz',
      quiz_questions: DEMO_HR_BASICS_QUIZ_QUESTIONS,
      status: 'ready_for_approval',
      source_refs: [
        { drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7', section_count: 2 },
        { drive_file_id: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R', section_count: 2 },
        { drive_file_id: '1wgolsCH2BOX5ZLICM05AtZLYqtiHsiEr', section_count: 1 },
      ],
    },
  ],
  generated_at: '2026-05-23T12:00:00.000Z',
  is_complete: true,
};
