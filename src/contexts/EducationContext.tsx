import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Course,
  Module,
  Lesson,
  Enrollment,
  LessonProgress,
  ProgressStatus,
  UUID,
} from '@/lib/education/training-types';
import {
  DEMO_ORIENTATION_COURSE,
  DEMO_MODULES,
  DEMO_LESSONS,
  DEMO_ENROLLMENT,
} from '@/lib/education/training-types';

// ============================================================
// Education Progress Context (Task D1)
// - Wraps EducationFacade from training-types
// - Persists lesson progress to localStorage (local-first)
// - Exposes useEducation + convenience hooks: useMyProgress, useCurrentEnrollment
// - Provides completeLesson, recordLessonProgress, live summaries
// ============================================================

interface EducationContextValue {
  // Core facade (from training-types interface)
  getMyEnrollments(): Enrollment[];
  getCourse(courseId: UUID): Course | undefined;
  getModule(moduleId: UUID): Module | undefined;
  getLessonsForModule(moduleId: UUID): Lesson[];
  recordLessonProgress(lessonId: UUID, status: ProgressStatus, timeSpent?: number): void;
  getProgressSummary(courseId: UUID): { completed: number; total: number; percentage: number };

  // Live derived
  currentEnrollment: Enrollment | null;

  // High-level actions used by UI
  completeLesson(lessonId: UUID): void;
  getLessonStatus(lessonId: UUID): ProgressStatus;

  // Demo seeding helpers (for wiring ModulePlayer with Orientation data)
  getDemoCourse(): Course;
  getDemoModule(): Module;
  getDemoLessons(): Lesson[];
}

const EducationContext = createContext<EducationContextValue | undefined>(undefined);

const LS_KEY = 'redex-education-progress-v1';

interface StoredProgress {
  lessonProgress: Record<string, { status: ProgressStatus; time_spent_seconds: number; completed_at?: string }>;
}

export function EducationProvider({ children }: { children: React.ReactNode }) {
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>({});

  // Load persisted progress from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const stored: StoredProgress = JSON.parse(raw);
        const restored: Record<string, LessonProgress> = {};
        Object.entries(stored.lessonProgress || {}).forEach(([lessonId, p]) => {
          restored[lessonId] = {
            id: `lp-${lessonId}`,
            enrollment_id: DEMO_ENROLLMENT.id,
            lesson_id: lessonId,
            status: p.status,
            time_spent_seconds: p.time_spent_seconds || 0,
            completed_at: p.completed_at,
          };
        });
        setLessonProgress(restored);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[EducationContext] Failed to load progress from localStorage', e);
    }
  }, []);

  // Persist on every change (local-first, instant)
  useEffect(() => {
    try {
      const toStore: StoredProgress = {
        lessonProgress: Object.fromEntries(
          Object.entries(lessonProgress).map(([lessonId, prog]) => [
            lessonId,
            {
              status: prog.status,
              time_spent_seconds: prog.time_spent_seconds,
              completed_at: prog.completed_at,
            },
          ])
        ),
      };
      localStorage.setItem(LS_KEY, JSON.stringify(toStore));
    } catch (e) {
      // ignore quota / private mode errors
    }
  }, [lessonProgress]);

  const recordLessonProgress = useCallback(
    (lessonId: UUID, status: ProgressStatus, timeSpent = 0) => {
      const now = new Date().toISOString();
      setLessonProgress((prev) => {
        const existing = prev[lessonId];
        return {
          ...prev,
          [lessonId]: {
            id: `lp-${lessonId}`,
            enrollment_id: DEMO_ENROLLMENT.id,
            lesson_id: lessonId,
            status,
            time_spent_seconds: (existing?.time_spent_seconds || 0) + timeSpent,
            completed_at: status === 'completed' ? now : existing?.completed_at,
          },
        };
      });
    },
    []
  );

  const completeLesson = useCallback(
    (lessonId: UUID) => {
      recordLessonProgress(lessonId, 'completed', 180); // simulate ~3 minutes of effort
    },
    [recordLessonProgress]
  );

  const getLessonStatus = useCallback(
    (lessonId: UUID): ProgressStatus => {
      return lessonProgress[lessonId]?.status ?? 'not_started';
    },
    [lessonProgress]
  );

  const getProgressSummary = useCallback(
    (_courseId: UUID): { completed: number; total: number; percentage: number } => {
      // Demo: use the seeded Orientation lessons (all belong to the single demo course)
      // In a fuller implementation we would filter lessons by the course's modules.
      const relevantLessons = DEMO_LESSONS;
      const total = relevantLessons.length;
      const completed = relevantLessons.filter((l) => getLessonStatus(l.id) === 'completed').length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { completed, total, percentage };
    },
    [getLessonStatus]
  );

  const currentEnrollment = useMemo<Enrollment | null>(() => {
    const summary = getProgressSummary(DEMO_ORIENTATION_COURSE.id);
    return {
      ...DEMO_ENROLLMENT,
      progress_percentage: summary.percentage,
    };
  }, [getProgressSummary]);

  const getMyEnrollments = useCallback((): Enrollment[] => {
    return currentEnrollment ? [currentEnrollment] : [];
  }, [currentEnrollment]);

  const getCourse = useCallback((courseId: UUID): Course | undefined => {
    return courseId === DEMO_ORIENTATION_COURSE.id ? DEMO_ORIENTATION_COURSE : undefined;
  }, []);

  const getModule = useCallback((moduleId: UUID): Module | undefined => {
    return DEMO_MODULES.find((m) => m.id === moduleId);
  }, []);

  const getLessonsForModule = useCallback((moduleId: UUID): Lesson[] => {
    return DEMO_LESSONS.filter((l) => l.module_id === moduleId);
  }, []);

  const getDemoCourse = useCallback(() => DEMO_ORIENTATION_COURSE, []);
  const getDemoModule = useCallback(() => DEMO_MODULES[0], []);
  const getDemoLessons = useCallback(() => DEMO_LESSONS, []);

  const value: EducationContextValue = {
    getMyEnrollments,
    getCourse,
    getModule,
    getLessonsForModule,
    recordLessonProgress,
    getProgressSummary,
    currentEnrollment,
    completeLesson,
    getLessonStatus,
    getDemoCourse,
    getDemoModule,
    getDemoLessons,
  };

  return <EducationContext.Provider value={value}>{children}</EducationContext.Provider>;
}

export function useEducation() {
  const context = useContext(EducationContext);
  if (context === undefined) {
    throw new Error('useEducation must be used within an EducationProvider');
  }
  return context;
}

// Requested convenience hooks
export function useMyProgress(courseId?: UUID) {
  const edu = useEducation();
  const id = courseId ?? DEMO_ORIENTATION_COURSE.id;
  const summary = edu.getProgressSummary(id);
  return {
    ...summary,
    enrollment: edu.currentEnrollment,
    completeLesson: edu.completeLesson,
  };
}

export function useCurrentEnrollment() {
  const { currentEnrollment } = useEducation();
  return currentEnrollment;
}
