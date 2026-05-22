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

export const DEMO_ENROLLMENT: Enrollment = {
  id: 'enroll-marcus-001',
  user_id: 'user-marcus',
  course_id: 'course-orientation-001',
  status: 'active',
  progress_percentage: 25,
  started_at: new Date().toISOString(),
};
