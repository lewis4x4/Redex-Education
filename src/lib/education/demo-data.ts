// ============================================================
// Redex Education — Demo / Seed Data
//
// Owns all DEMO_* exports used by the local-first, mock-backed
// EducationContext implementation. These are plain values that
// satisfy the canonical domain types in `@/types/training`.
//
// IMPORTANT:
//   - This file is a development/demo convenience. When Supabase-
//     backed reads land (post-Phase 2), components should consume
//     real query results through the facade — NOT these constants.
//   - Keep all literal IDs stable; persisted localStorage progress
//     records key off `lesson.id`.
// ============================================================

import type {
  Course,
  Module,
  Lesson,
  Enrollment,
  QuizQuestion,
} from '@/types/training';

export const DEMO_ORIENTATION_COURSE: Course = {
  id: 'course-orientation-001',
  org_id: 'org-redex',
  title: 'Redex Academy Orientation',
  slug: 'orientation',
  description:
    'Your first day at Redex — culture, tools, and expectations.',
  status: 'published',
  level: 'foundational',
  estimated_minutes: 45,
  learning_objectives: [
    'Understand Redex values and expectations',
    'Know the tools you will use daily',
    'Complete required safety and compliance acknowledgments',
  ],
  created_at: '2026-05-01T00:00:00.000Z',
  updated_at: '2026-05-22T00:00:00.000Z',
};

export const DEMO_HR_BASICS_COURSE: Course = {
  id: 'course-hr-basics-001',
  org_id: 'org-redex',
  title: 'HR Basics at Redex',
  slug: 'hr-basics',
  description:
    'A source-grounded HR onboarding module for new hires covering contacts, first-week expectations, and required acknowledgment.',
  status: 'published',
  level: 'foundational',
  estimated_minutes: 20,
  learning_objectives: [
    'Know who to contact for HR help in your first week.',
    'Understand first-week communication and onboarding expectations.',
    'Complete required acknowledgment and pass a light final quiz.',
  ],
  created_at: '2026-05-23T00:00:00.000Z',
  updated_at: '2026-05-23T00:00:00.000Z',
};

export const DEMO_HR_BASICS_MODULE: Module = {
  id: 'hr-basics-mod-001',
  course_id: 'course-hr-basics-001',
  title: 'HR Basics at Redex',
  order_index: 1,
  criticality: 'required',
  estimated_minutes: 20,
};

export const DEMO_MODULES: Module[] = [
  {
    id: 'mod-001',
    course_id: 'course-orientation-001',
    title: 'Welcome to Redex',
    order_index: 1,
    criticality: 'required',
    estimated_minutes: 12,
  },
  {
    id: 'mod-002',
    course_id: 'course-orientation-001',
    title: 'Tools & Access',
    order_index: 2,
    criticality: 'required',
    estimated_minutes: 18,
  },
  {
    id: 'mod-003',
    course_id: 'course-orientation-001',
    title: 'Safety & Compliance',
    order_index: 3,
    criticality: 'required',
    estimated_minutes: 15,
  },
  DEMO_HR_BASICS_MODULE,
];

// Demo quiz questions for the Orientation "Values" lesson
export const DEMO_VALUES_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q-values-001',
    question:
      "What is Redex's stated priority when it comes to decision making?",
    options: [
      'Profit maximization above all',
      'Speed and efficiency at any cost',
      'People first — safety, respect, and long-term impact',
      'Customer satisfaction only',
    ],
    correct_index: 2,
  },
  {
    id: 'q-values-002',
    question:
      'Redex requires all employees to complete safety training before accessing operational areas.',
    options: ['True', 'False'],
    correct_index: 0,
  },
  {
    id: 'q-values-003',
    question:
      'Which tool will you primarily use for daily shift handoffs and real-time updates?',
    options: [
      'Company email only',
      'The Redex Ops Hub mobile + web app',
      'Paper logbooks at each station',
      'Verbal briefings at shift change',
    ],
    correct_index: 1,
  },
  {
    id: 'q-values-004',
    question:
      'If you notice a potential safety hazard on the floor, the correct first action is:',
    options: [
      'Ignore it if the area is not your assigned station',
      'Report it immediately via Ops Hub or your supervisor',
      'Attempt to resolve it yourself without proper training',
      'Mention it casually at the end of your shift',
    ],
    correct_index: 1,
  },
];

export const DEMO_HR_BASICS_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'hr-basics-q-1',
    question: 'Who is your primary contact for HR questions in your first week?',
    options: ['Sarah Chen', 'Your manager', 'People Ops', 'All of the above'],
    correct_index: 3,
  },
  {
    id: 'hr-basics-q-2',
    question: 'Where does Redex expect you to handle difficult or sensitive conversations?',
    options: ['Slack', 'Email', 'In-person or video', 'Public chat'],
    correct_index: 2,
  },
  {
    id: 'hr-basics-q-3',
    question: 'True or False — Redex expects you to respond to Slack messages outside business hours.',
    options: ['True', 'False'],
    correct_index: 1,
  },
  {
    id: 'hr-basics-q-4',
    question: 'By end of your first week, you should have:',
    options: [
      'Completed I-9 verification',
      'Submitted your first timesheet',
      'Scheduled a 30-day check-in',
      'All of the above',
    ],
    correct_index: 3,
  },
  {
    id: 'hr-basics-q-5',
    question:
      "If you have a concern your direct manager cannot resolve, what's the correct next step?",
    options: ['Wait it out', 'Escalate to People Ops', 'Post in #general', 'Quit'],
    correct_index: 1,
  },
];

export const DEMO_LESSONS: Lesson[] = [
  {
    id: 'lesson-welcome-video',
    module_id: 'mod-001',
    title: 'A quick hello from leadership',
    lesson_type: 'video',
    criticality: 'required',
    order_index: 1,
    estimated_minutes: 4,
    content: {
      type: 'video',
      video_url: 'https://example.com/welcome-video.mp4',
      duration_seconds: 180,
      poster_url: 'https://example.com/welcome-video-poster.jpg',
      media_provider: 'manual',
      media_status: 'ready',
      media_asset_id: 'media-welcome-video-demo',
      download_url: 'https://example.com/welcome-video.mp4?download=1',
      provenance: {
        generated_from: 'manual_upload',
        source_section_ids: ['source-redex-values', 'source-safety-basics'],
        notes_markdown: 'Demo-only video metadata used to exercise the learner video surface.',
      },
      chapters: [
        { id: 'chapter-welcome-1', title: 'Welcome', start_seconds: 0, end_seconds: 60, source_section_ids: ['source-redex-values'] },
        { id: 'chapter-welcome-2', title: 'How Redex works', start_seconds: 60, end_seconds: 130, source_section_ids: ['source-redex-values'] },
        { id: 'chapter-welcome-3', title: 'Your first action', start_seconds: 130, end_seconds: 180, source_section_ids: ['source-safety-basics'] },
      ],
      transcript_segments: [
        {
          id: 'segment-welcome-1',
          start_seconds: 0,
          end_seconds: 60,
          text_markdown: 'Welcome to Redex. We lead with people, safety, respect, and long-term impact.',
          derived_from_section_ids: ['source-redex-values'],
        },
        {
          id: 'segment-welcome-2',
          start_seconds: 60,
          end_seconds: 130,
          text_markdown: 'Your first week is about learning the tools, asking questions, and escalating early when blocked.',
          derived_from_section_ids: ['source-redex-values'],
        },
        {
          id: 'segment-welcome-3',
          start_seconds: 130,
          end_seconds: 180,
          text_markdown: 'Before accessing operational areas, complete your assigned safety and compliance training.',
          derived_from_section_ids: ['source-safety-basics'],
        },
      ],
      checkpoints: [
        {
          id: 'checkpoint-welcome-1',
          at_seconds: 90,
          question: 'What should you do when you are blocked during your first week?',
          options: ['Wait until someone notices', 'Ask questions and escalate early', 'Skip the task'],
          correct_index: 1,
          feedback_correct_markdown: 'Correct. Early escalation keeps onboarding safe and visible.',
          feedback_incorrect_markdown: 'Review the first-week guidance, then choose the supported action.',
          source_section_ids: ['source-redex-values'],
          segment_start_seconds: 60,
          required: false,
          must_answer_correctly: false,
        },
      ],
    },
  },
  {
    id: 'lesson-values',
    module_id: 'mod-001',
    title: 'Redex Values & What We Expect',
    lesson_type: 'text',
    criticality: 'required',
    order_index: 2,
    estimated_minutes: 5,
    content: {
      type: 'text',
      body_markdown:
        'At Redex, we lead with people. Safety, respect, and long-term impact guide every decision.',
      estimated_read_minutes: 5,
    },
  },
  {
    id: 'lesson-values-quiz',
    module_id: 'mod-001',
    title: 'Quick Check: Values',
    lesson_type: 'quiz',
    criticality: 'required',
    order_index: 3,
    estimated_minutes: 3,
    content: {
      type: 'quiz',
      questions: DEMO_VALUES_QUIZ_QUESTIONS,
    },
  },
];

export const DEMO_HR_BASICS_LESSONS: Lesson[] = [
  {
    id: 'hr-basics-lesson-1-welcome',
    module_id: 'hr-basics-mod-001',
    title: 'Welcome to Redex',
    lesson_type: 'text',
    criticality: 'required',
    order_index: 1,
    estimated_minutes: 3,
    content: {
      type: 'text',
      body_markdown:
        "Welcome to Redex. Your first week is about getting set up, meeting the people who support you, and learning where to find what you need. We don't expect memorization — we expect questions, notes, and early escalation when blocked.",
      estimated_read_minutes: 3,
      blocks: [
        {
          id: 'hr-basics-reading-welcome-prose',
          kind: 'prose',
          heading: 'What week one is for',
          markdown:
            'Your first week is about getting set up, meeting the people who support you, and learning where to find what you need.',
        },
        {
          id: 'hr-basics-reading-welcome-callout',
          kind: 'callout',
          tone: 'key_takeaway',
          title: 'Ask early',
          markdown: "We don't expect memorization — we expect questions, notes, and early escalation when blocked.",
        },
      ],
    },
  },
  {
    id: 'hr-basics-lesson-2-contact',
    module_id: 'hr-basics-mod-001',
    title: 'Who to Contact for HR Help',
    lesson_type: 'text',
    criticality: 'required',
    order_index: 2,
    estimated_minutes: 3,
    content: {
      type: 'text',
      body_markdown:
        'People Ops is your first contact for HR topics. Primary contact: peopleops@redex.example. Your onboarding buddy is Sarah Chen (sarah.chen@redex.example). For urgent after-hours issues, contact your direct manager first, then follow up with People Ops.',
      estimated_read_minutes: 3,
    },
  },
  {
    id: 'hr-basics-lesson-3-payroll-timekeeping',
    module_id: 'hr-basics-mod-001',
    title: 'Payroll and Timekeeping Basics',
    lesson_type: 'text',
    criticality: 'required',
    order_index: 3,
    estimated_minutes: 4,
    content: {
      type: 'text',
      body_markdown:
        '⚠️ Missing-source warning: payroll and timekeeping policy language is still placeholder content in the source file. Do not treat generated copy in this section as final policy. Use People Ops for current approved guidance until this section is finalized.',
      estimated_read_minutes: 4,
    },
  },
  {
    id: 'hr-basics-lesson-4-first-week',
    module_id: 'hr-basics-mod-001',
    title: 'First-Week Expectations',
    lesson_type: 'text',
    criticality: 'required',
    order_index: 4,
    estimated_minutes: 4,
    content: {
      type: 'text',
      body_markdown:
        'By day 1, complete I-9 verification, required acknowledgments, and device setup. By day 2–3, meet your onboarding buddy and complete role-required safety acknowledgments. By day 4–5, submit your first timesheet, schedule a 30-day check-in, and complete assigned onboarding training.',
      estimated_read_minutes: 4,
    },
  },
  {
    id: 'hr-basics-lesson-5-acknowledgment',
    module_id: 'hr-basics-mod-001',
    title: 'Required Acknowledgment',
    lesson_type: 'acknowledgment',
    criticality: 'required',
    order_index: 5,
    estimated_minutes: 2,
    content: {
      type: 'acknowledgment',
      statement_markdown:
        'I acknowledge that I have read and understood the HR Basics onboarding content covered so far, including communication expectations and first-week onboarding responsibilities. I understand that escalation policy details are still pending approved source language and I will contact People Ops for current guidance.',
      required_signature: 'click',
    },
  },
  {
    id: 'hr-basics-lesson-6-final-quiz',
    module_id: 'hr-basics-mod-001',
    title: 'Final Quiz',
    lesson_type: 'quiz',
    criticality: 'required',
    order_index: 6,
    estimated_minutes: 4,
    content: {
      type: 'quiz',
      questions: DEMO_HR_BASICS_QUIZ_QUESTIONS,
      passing_threshold: 80,
      allow_retakes: true,
    },
  },
];

export const DEMO_ENROLLMENT: Enrollment = {
  id: 'enroll-marcus-001',
  user_id: 'user-marcus',
  course_id: 'course-orientation-001',
  status: 'active',
  progress_percentage: 25,
  started_at: new Date().toISOString(),
};

export const DEMO_HR_BASICS_ENROLLMENT: Enrollment = {
  id: 'enroll-marcus-hr-basics-001',
  user_id: 'user-marcus',
  course_id: 'course-hr-basics-001',
  status: 'active',
  progress_percentage: 40,
  started_at: new Date().toISOString(),
};
