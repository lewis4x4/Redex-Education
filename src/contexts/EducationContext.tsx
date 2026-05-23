import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Course,
  Module,
  Lesson,
  Enrollment,
  LessonProgress,
  ProgressStatus,
  UUID,
} from '@/lib/education';
import { EducationContext, type EducationContextValue } from './education-context';
import {
  DEMO_ORIENTATION_COURSE,
  DEMO_HR_BASICS_COURSE,
  DEMO_MODULES,
  DEMO_LESSONS,
  DEMO_HR_BASICS_LESSONS,
  DEMO_ENROLLMENT,
  DEMO_HR_BASICS_ENROLLMENT,
} from '@/lib/education';

// ============================================================
// Education Progress Context (Task D1)
// - Wraps EducationFacade from training-types
// - Persists lesson progress to localStorage (local-first)
// - Provider owns local-first progress state and exposes context for hooks
// - Provides completeLesson, recordLessonProgress, live summaries
// ============================================================

const LS_KEY = 'redex-education-progress-v1';
const ALL_DEMO_LESSONS = [...DEMO_LESSONS, ...DEMO_HR_BASICS_LESSONS];

interface StoredLessonProgress {
  status: ProgressStatus;
  time_spent_seconds: number;
  completed_at?: string;
}

interface StoredProgress {
  lessonProgress: Record<string, StoredLessonProgress>;
}

let warnedAboutProgressHydration = false;

function restoreLessonProgress(): Record<string, LessonProgress> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      return {};
    }

    const stored = JSON.parse(raw) as Partial<StoredProgress>;
    const restored: Record<string, LessonProgress> = {};

    Object.entries(stored.lessonProgress ?? {}).forEach(([lessonId, progress]) => {
      restored[lessonId] = {
        id: `lp-${lessonId}`,
        enrollment_id: DEMO_ENROLLMENT.id,
        lesson_id: lessonId,
        status: progress.status,
        time_spent_seconds: progress.time_spent_seconds || 0,
        completed_at: progress.completed_at,
      };
    });

    return restored;
  } catch (error) {
    if (!warnedAboutProgressHydration) {
      warnedAboutProgressHydration = true;
      console.warn('[EducationContext] Failed to load progress from localStorage', error);
    }
    return {};
  }
}

export function EducationProvider({ children }: { children: React.ReactNode }) {
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>(() => restoreLessonProgress());

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
    } catch (error) {
      console.warn('[EducationContext] Failed to persist progress to localStorage', error);
    }
  }, [lessonProgress]);

  const recordLessonProgress = useCallback(
    (lessonId: UUID, status: ProgressStatus, timeSpent = 0) => {
      setLessonProgress((prev) => {
        const existing = prev[lessonId];

        if (existing?.status === 'completed' && status === 'completed') {
          return prev;
        }

        const now = new Date().toISOString();

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
    (courseId: UUID): { completed: number; total: number; percentage: number } => {
      const moduleIds = new Set(
        DEMO_MODULES.filter((module) => module.course_id === courseId).map((module) => module.id)
      );
      const relevantLessons = ALL_DEMO_LESSONS.filter((lesson) => moduleIds.has(lesson.module_id));
      const total = relevantLessons.length;
      const completed = relevantLessons.filter((lesson) => getLessonStatus(lesson.id) === 'completed').length;
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
    return currentEnrollment ? [currentEnrollment, DEMO_HR_BASICS_ENROLLMENT] : [DEMO_HR_BASICS_ENROLLMENT];
  }, [currentEnrollment]);

  const getCourse = useCallback((courseId: UUID): Course | undefined => {
    if (courseId === DEMO_ORIENTATION_COURSE.id) {
      return DEMO_ORIENTATION_COURSE;
    }

    if (courseId === DEMO_HR_BASICS_COURSE.id) {
      return DEMO_HR_BASICS_COURSE;
    }

    return undefined;
  }, []);

  const getModule = useCallback((moduleId: UUID): Module | undefined => {
    return DEMO_MODULES.find((m) => m.id === moduleId);
  }, []);

  const getLessonsForModule = useCallback((moduleId: UUID): Lesson[] => {
    return ALL_DEMO_LESSONS.filter((l) => l.module_id === moduleId);
  }, []);

  const getDemoCourse = useCallback(() => DEMO_ORIENTATION_COURSE, []);
  const getDemoModule = useCallback(() => DEMO_MODULES[0], []);
  const getDemoLessons = useCallback(() => DEMO_LESSONS, []);

  const value = useMemo<EducationContextValue>(
    () => ({
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
    }),
    [
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
    ]
  );

  return <EducationContext.Provider value={value}>{children}</EducationContext.Provider>;
}
