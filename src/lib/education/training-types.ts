// ============================================================
// Redex Education — Core Domain Types (adapted from canonical models)
// Used by both Redex Academy (learner) and AI Course Foundry (admin)
// ============================================================

export type UUID = string;
export type ISODateTime = string;

export type LessonType =
  | 'video' | 'reading' | 'interactive' | 'quiz' | 'assignment'
  | 'discussion' | 'simulation' | 'live_session' | 'reflection_prompt';

export type Criticality = 'required' | 'recommended' | 'optional' | 'bonus';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'failed';

export type CourseStatus = 'draft' | 'in_review' | 'published' | 'archived';

export type EnrollmentStatus = 'invited' | 'active' | 'completed' | 'dropped';

// Core content entities
export interface Course {
  id: UUID;
  org_id: UUID;
  title: string;
  slug: string;
  description?: string;
  status: CourseStatus;
  level: string;
  estimated_minutes: number;
  learning_objectives: string[];
}

export interface Module {
  id: UUID;
  course_id: UUID;
  title: string;
  order_index: number;
  criticality: Criticality;
  estimated_minutes: number;
}

export interface Lesson {
  id: UUID;
  module_id: UUID;
  title: string;
  lesson_type: LessonType;
  criticality: Criticality;
  order_index: number;
  estimated_minutes: number;
  content: LessonContent;
}

export type LessonContent =
  | { type: 'video'; video_url: string; duration_seconds?: number }
  | { type: 'reading'; body_markdown: string }
  | { type: 'quiz'; questions: QuizQuestion[] }
  | { type: 'assignment'; instructions: string }
  | { type: 'reflection_prompt'; prompt: string };

export interface QuizQuestion {
  id: UUID;
  question: string;
  options: string[];
  correct_index?: number;
}

// Progress & enrollment
export interface Enrollment {
  id: UUID;
  user_id: UUID;
  course_id: UUID;
  status: EnrollmentStatus;
  progress_percentage: number;
  started_at: ISODateTime;
}

export interface LessonProgress {
  id: UUID;
  enrollment_id: UUID;
  lesson_id: UUID;
  status: ProgressStatus;
  time_spent_seconds: number;
  completed_at?: ISODateTime;
}

// Simple facade for current slices (mock/localStorage backed)
export interface EducationFacade {
  getMyEnrollments(): Enrollment[];
  getCourse(courseId: UUID): Course | undefined;
  getModule(moduleId: UUID): Module | undefined;
  getLessonsForModule(moduleId: UUID): Lesson[];
  recordLessonProgress(lessonId: UUID, status: ProgressStatus, timeSpent?: number): void;
  getProgressSummary(courseId: UUID): { completed: number; total: number; percentage: number };
}

// Seeded demo data for "Orientation" course (used in welcome + player)
export const DEMO_ORIENTATION_COURSE: Course = {
  id: 'course-orientation-001',
  org_id: 'org-redex',
  title: 'Redex Academy Orientation',
  slug: 'orientation',
  description: 'Your first day at Redex — culture, tools, and expectations.',
  status: 'published',
  level: 'foundational',
  estimated_minutes: 45,
  learning_objectives: [
    'Understand Redex values and expectations',
    'Know the tools you will use daily',
    'Complete required safety and compliance acknowledgments',
  ],
};

export const DEMO_MODULES: Module[] = [
  { id: 'mod-001', course_id: 'course-orientation-001', title: 'Welcome to Redex', order_index: 1, criticality: 'required', estimated_minutes: 12 },
  { id: 'mod-002', course_id: 'course-orientation-001', title: 'Tools & Access', order_index: 2, criticality: 'required', estimated_minutes: 18 },
  { id: 'mod-003', course_id: 'course-orientation-001', title: 'Safety & Compliance', order_index: 3, criticality: 'required', estimated_minutes: 15 },
];

// Demo quiz questions for the Orientation "Values" lesson (Task C)
export const DEMO_VALUES_QUIZ_QUESTIONS = [
  {
    id: 'q-values-001',
    question: "What is Redex's stated priority when it comes to decision making?",
    options: [
      "Profit maximization above all",
      "Speed and efficiency at any cost",
      "People first — safety, respect, and long-term impact",
      "Customer satisfaction only",
    ],
    correct_index: 2,
  },
  {
    id: 'q-values-002',
    question: "Redex requires all employees to complete safety training before accessing operational areas.",
    options: ["True", "False"],
    correct_index: 0,
  },
  {
    id: 'q-values-003',
    question: "Which tool will you primarily use for daily shift handoffs and real-time updates?",
    options: [
      "Company email only",
      "The Redex Ops Hub mobile + web app",
      "Paper logbooks at each station",
      "Verbal briefings at shift change",
    ],
    correct_index: 1,
  },
  {
    id: 'q-values-004',
    question: "If you notice a potential safety hazard on the floor, the correct first action is:",
    options: [
      "Ignore it if the area is not your assigned station",
      "Report it immediately via Ops Hub or your supervisor",
      "Attempt to resolve it yourself without proper training",
      "Mention it casually at the end of your shift",
    ],
    correct_index: 1,
  },
];

export const DEMO_LESSONS: Lesson[] = [
  { id: 'lesson-welcome-video', module_id: 'mod-001', title: 'A quick hello from leadership', lesson_type: 'video', criticality: 'required', order_index: 1, estimated_minutes: 4, content: { type: 'video', video_url: 'https://example.com/welcome-video.mp4' } },
  { id: 'lesson-values', module_id: 'mod-001', title: 'Redex Values & What We Expect', lesson_type: 'reading', criticality: 'required', order_index: 2, estimated_minutes: 5, content: { type: 'reading', body_markdown: '...' } },
  { id: 'lesson-values-quiz', module_id: 'mod-001', title: 'Quick Check: Values', lesson_type: 'quiz', criticality: 'required', order_index: 3, estimated_minutes: 3, content: { type: 'quiz', questions: DEMO_VALUES_QUIZ_QUESTIONS } },
];

export const DEMO_ENROLLMENT: Enrollment = {
  id: 'enroll-marcus-001',
  user_id: 'user-marcus',
  course_id: 'course-orientation-001',
  status: 'active',
  progress_percentage: 25,
  started_at: new Date().toISOString(),
};
