import { createContext } from 'react';
import type {
  Course,
  Module,
  Lesson,
  Enrollment,
  ProgressStatus,
  UUID,
} from '@/lib/education';
import type { WriteError } from '@/lib/education/writeErrors';

export interface EducationContextValue {
  // Core facade (from training-types interface)
  getMyEnrollments(): Enrollment[];
  getCourse(courseId: UUID): Course | undefined;
  getModule(moduleId: UUID): Module | undefined;
  getLessonsForModule(moduleId: UUID): Lesson[];
  recordLessonProgress(lessonId: UUID, status: ProgressStatus, timeSpent?: number): void;
  getProgressSummary(courseId: UUID): { completed: number; total: number; percentage: number };

  // Live derived
  currentEnrollment: Enrollment | null;
  lastWriteError: WriteError | null;
  clearLastWriteError(): void;

  // High-level actions used by UI
  completeLesson(lessonId: UUID): void;
  getLessonStatus(lessonId: UUID): ProgressStatus;

  // Demo seeding helpers (for wiring ModulePlayer with Orientation data)
  getDemoCourse(): Course;
  getDemoModule(): Module;
  getDemoLessons(): Lesson[];
}

export const EducationContext = createContext<EducationContextValue | undefined>(undefined);
