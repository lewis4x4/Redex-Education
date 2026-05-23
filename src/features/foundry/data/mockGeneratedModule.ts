import type { GeneratedModulePreview } from '@/lib/education';

export const MOCK_GENERATED_MODULE: GeneratedModulePreview = {
  module_title: 'HR Basics at Redex',
  lessons: [
    {
      lesson_index: 0,
      module_index: 0,
      title: 'Welcome to Redex',
      lesson_type: 'text',
      body_markdown:
        "Welcome to Redex. We're glad you're here and excited to support your first week.\n\nOur culture is built on respect, ownership, and clear communication. Every team member is expected to ask questions early and escalate concerns quickly.\n\nAs you move through onboarding, use this training as a practical guide to how we work, who can help, and where to find policy details.",
      status: 'draft',
      source_refs: [{ drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7', section_count: 1 }],
    },
    {
      lesson_index: 1,
      module_index: 0,
      title: 'Code of Conduct — Respect and Reporting',
      lesson_type: 'text',
      body_markdown:
        "Redex expects all employees to treat coworkers, customers, and partners with professionalism and respect. Harassment, discrimination, and retaliation are prohibited.\n\nIf you witness or experience concerning behavior, report it to your manager, HR, or through the designated reporting channel. You can ask for confidentiality, and all reports are reviewed seriously.\n\nLeaders are responsible for reinforcing these expectations and documenting corrective actions when needed.",
      status: 'ready_for_approval',
      source_refs: [{ drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7', section_count: 2 }],
    },
    {
      lesson_index: 2,
      module_index: 0,
      title: 'Acknowledgment: I have read the Code of Conduct',
      lesson_type: 'acknowledgment',
      acknowledgment_text:
        'I acknowledge that I have read and understood the Redex Code of Conduct and agree to follow it in my daily work.',
      status: 'draft',
      source_refs: [{ drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7', section_count: 1 }],
    },
    {
      lesson_index: 0,
      module_index: 1,
      title: 'PTO Policy Overview',
      lesson_type: 'text',
      body_markdown:
        'This section introduces PTO eligibility, accrual expectations, and policy ownership. Final legal wording is pending in the source document before publication.\n\nEmployees should still follow manager approval workflows and submit requests through the standard system while policy text is finalized.\n\nDo not treat this preview copy as final policy language.',
      status: 'missing_source',
      status_note:
        'Source pto-policy.md contains [PLACEHOLDER] for eligibility and accrual sections',
      source_refs: [{ drive_file_id: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R', section_count: 3 }],
    },
    {
      lesson_index: 1,
      module_index: 1,
      title: 'How to Request Time Off',
      lesson_type: 'text',
      body_markdown:
        'Submit PTO requests in advance using the company request flow. Include dates, coverage notes, and any handoff details your team needs.\n\nManagers review requests based on staffing needs and business timing. Early submissions improve approval speed and scheduling flexibility.\n\nFor urgent or unexpected situations, notify your manager as soon as possible and follow up with a formal request record.',
      status: 'draft',
      source_refs: [{ drive_file_id: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R', section_count: 1 }],
    },
    {
      lesson_index: 2,
      module_index: 1,
      title: 'Quick Check: PTO Basics',
      lesson_type: 'quiz',
      quiz_questions: [
        {
          id: 'quiz-pto-1',
          question: 'What is the best time to submit a planned PTO request?',
          options: [
            'As early as possible with coverage notes',
            'Only after booking travel',
            'On the day PTO starts',
            'At the end of the month',
          ],
          correct_index: 0,
        },
        {
          id: 'quiz-pto-2',
          question: 'If a request is urgent, what should you do first?',
          options: [
            'Wait for the next team meeting',
            'Message teammates only',
            'Notify your manager immediately',
            'Skip the formal request system',
          ],
          correct_index: 2,
        },
        {
          id: 'quiz-pto-3',
          question: 'Why should PTO requests include handoff details?',
          options: [
            'To reduce manager paperwork',
            'To keep team operations covered',
            'To avoid entering dates',
            'To bypass approval',
          ],
          correct_index: 1,
        },
      ],
      status: 'needs_review',
      source_refs: [{ drive_file_id: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R', section_count: 2 }],
    },
    {
      lesson_index: 0,
      module_index: 2,
      title: 'The Day-by-Day Checklist',
      lesson_type: 'checklist',
      body_markdown:
        'Use this checklist to structure your first week at Redex. Complete account setup, review key policies, and meet critical team contacts.\n\nBlock short daily windows for onboarding tasks so they do not compete with operational responsibilities.\n\nIf a required step is blocked, flag it to your onboarding buddy or manager the same day.',
      status: 'draft',
      source_refs: [{ drive_file_id: '1wgolsCH2BOX5ZLICM05AtZLYqtiHsiEr', section_count: 1 }],
    },
    {
      lesson_index: 1,
      module_index: 2,
      title: 'Meeting Your Onboarding Buddy',
      lesson_type: 'text',
      body_markdown:
        'Your onboarding buddy is your first stop for day-to-day questions. They can help with systems, team norms, and communication expectations.\n\nCome prepared with specific questions from your first few days. This keeps your check-ins practical and action-oriented.\n\nUse your buddy relationship to accelerate confidence, then transition to regular peer support as onboarding wraps up.',
      status: 'ready_for_approval',
      source_refs: [{ drive_file_id: '1wgolsCH2BOX5ZLICM05AtZLYqtiHsiEr', section_count: 1 }],
    },
  ],
  generated_at: '2026-05-22T12:00:00.000Z',
  is_complete: true,
};
