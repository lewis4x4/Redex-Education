import type { LessonReviewItem } from '@/lib/education';

export const MOCK_LESSON_REVIEWS: LessonReviewItem[] = [
  {
    lesson_index: 0,
    module_index: 0,
    lesson_title: 'Welcome to Redex',
    confidence: 'high',
    has_unsupported_claim: false,
    status: 'pending',
    source_excerpts: [
      {
        drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7',
        source_title: 'code-of-conduct.md',
        section_heading: 'Welcome and expectations',
        section_body:
          'At Redex, every employee is expected to act with respect, integrity, and accountability from day one.',
      },
    ],
  },
  {
    lesson_index: 1,
    module_index: 0,
    lesson_title: 'Code of Conduct — Respect and Reporting',
    confidence: 'high',
    has_unsupported_claim: false,
    status: 'approved',
    source_excerpts: [
      {
        drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7',
        source_title: 'code-of-conduct.md',
        section_heading: 'Respect in the workplace',
        section_body:
          'Harassment, discrimination, and retaliation are prohibited. Team members must maintain a professional environment.',
      },
      {
        drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7',
        source_title: 'code-of-conduct.md',
        section_heading: 'Reporting concerns',
        section_body:
          'Report concerns to your manager, HR, or the approved reporting channel. Reports are reviewed promptly.',
      },
      {
        drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7',
        source_title: 'code-of-conduct.md',
        section_heading: 'Leadership responsibilities',
        section_body:
          'Leaders must model policy behavior and document corrective actions when policy violations occur.',
      },
    ],
  },
  {
    lesson_index: 2,
    module_index: 0,
    lesson_title: 'Acknowledgment: I have read the Code of Conduct',
    confidence: 'medium',
    has_unsupported_claim: false,
    status: 'pending',
    source_excerpts: [
      {
        drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7',
        source_title: 'code-of-conduct.md',
        section_heading: 'Employee acknowledgment',
        section_body:
          'Employees must acknowledge they have reviewed and understood the Code of Conduct.',
      },
    ],
  },
  {
    lesson_index: 0,
    module_index: 1,
    lesson_title: 'PTO Policy Overview',
    confidence: 'unsupported',
    has_unsupported_claim: true,
    unsupported_note:
      "Claims '2 weeks/year accrual' but source pto-policy.md eligibility/accrual sections are [PLACEHOLDER]",
    status: 'pending',
    source_excerpts: [
      {
        drive_file_id: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R',
        source_title: 'pto-policy.md',
        section_heading: 'Eligibility',
        section_body: '[PLACEHOLDER — Redex HR to confirm PTO eligibility language]',
      },
      {
        drive_file_id: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R',
        source_title: 'pto-policy.md',
        section_heading: 'Accrual',
        section_body: '[PLACEHOLDER — Redex HR to finalize annual accrual schedule]',
      },
    ],
  },
  {
    lesson_index: 1,
    module_index: 1,
    lesson_title: 'How to Request Time Off',
    confidence: 'medium',
    has_unsupported_claim: false,
    status: 'pending',
    source_excerpts: [
      {
        drive_file_id: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R',
        source_title: 'pto-policy.md',
        section_heading: 'Request workflow',
        section_body:
          'Submit requests in the standard system with dates, team coverage notes, and handoff details.',
      },
    ],
  },
  {
    lesson_index: 2,
    module_index: 1,
    lesson_title: 'Quick Check: PTO Basics',
    confidence: 'low',
    has_unsupported_claim: false,
    status: 'pending',
    source_excerpts: [
      {
        drive_file_id: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R',
        source_title: 'pto-policy.md',
        section_heading: 'Manager approval timing',
        section_body:
          'Managers evaluate timing and staffing impact before approving PTO requests.',
      },
    ],
  },
  {
    lesson_index: 0,
    module_index: 2,
    lesson_title: 'The Day-by-Day Checklist',
    confidence: 'medium',
    has_unsupported_claim: false,
    status: 'pending',
    source_excerpts: [
      {
        drive_file_id: '1wgolsCH2BOX5ZLICM05AtZLYqtiHsiEr',
        source_title: 'new-hire-checklist.md',
        section_heading: 'Week one checklist',
        section_body:
          'Complete account setup, policy review, and first-week manager and buddy check-ins.',
      },
    ],
  },
  {
    lesson_index: 1,
    module_index: 2,
    lesson_title: 'Meeting Your Onboarding Buddy',
    confidence: 'high',
    has_unsupported_claim: false,
    status: 'approved',
    source_excerpts: [
      {
        drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7',
        source_title: 'code-of-conduct.md',
        section_heading: 'Communication norms',
        section_body:
          'Use regular check-ins, ask clarifying questions early, and escalate blockers through agreed channels.',
      },
    ],
  },
];
