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
import { getDataSource } from '@/lib/education/dataSource';
import * as supabaseDataProvider from '@/lib/education/supabaseDataProvider';
import { toWriteError, type WriteError } from '@/lib/education/writeErrors';
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
// - Persists lesson progress to localStorage as an offline cache
// - In supabase mode, server progress writes are now the source of truth;
//   localStorage hydration is ignored so cached progress cannot supersede DB reads.
// - Provides completeLesson, recordLessonProgress, live summaries
// ============================================================

const LS_KEY = 'redex-education-progress-v1';
const ALL_DEMO_LESSONS = [...DEMO_LESSONS, ...DEMO_HR_BASICS_LESSONS];
const DEMO_COURSE_IDS = new Set([DEMO_ORIENTATION_COURSE.id, DEMO_HR_BASICS_COURSE.id]);
const DEMO_MODULE_IDS = new Set(DEMO_MODULES.map((module) => module.id));
const DEMO_LESSON_IDS = new Set(ALL_DEMO_LESSONS.map((lesson) => lesson.id));

function getDemoEnrollmentForLesson(lessonId: UUID): Enrollment {
  const lesson = ALL_DEMO_LESSONS.find((candidate) => candidate.id === lessonId);
  const module = lesson ? DEMO_MODULES.find((candidate) => candidate.id === lesson.module_id) : undefined;

  return module?.course_id === DEMO_HR_BASICS_COURSE.id ? DEMO_HR_BASICS_ENROLLMENT : DEMO_ENROLLMENT;
}

function getEnrollmentIdForLesson(lessonId: UUID): UUID {
  return getDemoEnrollmentForLesson(lessonId).id;
}

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
  if (getDataSource() === 'supabase') {
    return {};
  }

  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const stored = parsed as Partial<StoredProgress>;
    if (!stored.lessonProgress || typeof stored.lessonProgress !== 'object') {
      return {};
    }

    const restored: Record<string, LessonProgress> = {};

    Object.entries(stored.lessonProgress).forEach(([lessonId, progress]) => {
      restored[lessonId] = {
        id: `lp-${lessonId}`,
        enrollment_id: getEnrollmentIdForLesson(lessonId),
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

interface EducationProviderProps {
  children: React.ReactNode;
  userId?: string | null;
}

export function EducationProvider({ children, userId = null }: EducationProviderProps) {
  const dataSource = getDataSource();
  const mockAuthEnabled = import.meta.env.VITE_MOCK_AUTH === 'true';

  if (dataSource === 'supabase' && mockAuthEnabled && !userId) {
    throw new Error('[EducationContext] Invalid auth/data mode: VITE_MOCK_AUTH=true cannot be combined with VITE_DATA_SOURCE=supabase without a real authenticated user.');
  }
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>(() => restoreLessonProgress());
  const [realEnrollments, setRealEnrollments] = useState<Enrollment[]>([]);
  const [lastWriteError, setLastWriteError] = useState<WriteError | null>(null);
  const clearLastWriteError = useCallback(() => setLastWriteError(null), []);

  useEffect(() => {
    if (dataSource !== 'supabase') {
      return undefined;
    }

    let cancelled = false;

    if (!userId) {
      queueMicrotask(() => {
        if (!cancelled) {
          setRealEnrollments([]);
          setLessonProgress({});
        }
      });
      return () => {
        cancelled = true;
      };
    }


    Promise.all([
      supabaseDataProvider.getEnrollmentsForUser(userId),
      supabaseDataProvider.getProgressForUser(userId),
    ])
      .then(([enrollments, progressRows]) => {
        if (cancelled) {
          return;
        }

        const unknownEnrollmentCourseIds = enrollments
          .map((enrollment) => enrollment.course_id)
          .filter((courseId) => !DEMO_COURSE_IDS.has(courseId));
        const unknownProgressLessonIds = progressRows
          .map((progress) => progress.lesson_id)
          .filter((lessonId) => !DEMO_LESSON_IDS.has(lessonId));

        if (unknownEnrollmentCourseIds.length > 0 || unknownProgressLessonIds.length > 0) {
          setRealEnrollments([]);
          setLessonProgress({});
          setLastWriteError(
            toWriteError(
              'loadProgressForUser',
              new Error(
                `Supabase learner data includes non-demo catalog ids (courses: ${unknownEnrollmentCourseIds.join(', ') || 'none'}; lessons: ${unknownProgressLessonIds.join(', ') || 'none'}). Real mode is constrained to demo catalog ids in this build.`,
              ),
            ),
          );
          return;
        }

        setRealEnrollments(enrollments);
        setLessonProgress(
          Object.fromEntries(progressRows.map((progress) => [progress.lesson_id, progress]))
        );
        setLastWriteError(null);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRealEnrollments([]);
          setLessonProgress({});
          setLastWriteError(toWriteError('loadProgressForUser', error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dataSource, userId]);

  // Persist mock-mode progress on every change (local-first, instant)
  useEffect(() => {
    if (dataSource === 'supabase') {
      return;
    }

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
  }, [dataSource, lessonProgress]);

  const recordLessonProgress = useCallback(
    (lessonId: UUID, status: ProgressStatus, timeSpent = 0) => {
      const existingSnapshot = lessonProgress[lessonId];

      if (existingSnapshot?.status === 'completed' && status === 'completed') {
        return;
      }

      const now = new Date().toISOString();
      const lesson = ALL_DEMO_LESSONS.find((candidate) => candidate.id === lessonId);
      const module = lesson ? DEMO_MODULES.find((candidate) => candidate.id === lesson.module_id) : undefined;
      const enrollment =
        dataSource === 'supabase'
          ? realEnrollments.find((candidate) => candidate.course_id === module?.course_id) ?? realEnrollments[0]
          : getDemoEnrollmentForLesson(lessonId);

      if (dataSource === 'supabase' && !lesson) {
        setLastWriteError(
          toWriteError(
            'recordLessonProgress',
            new Error(`Cannot record progress for unknown lesson id "${lessonId}" in supabase mode.`),
          ),
        );
        return;
      }

      if (dataSource === 'supabase' && module && !DEMO_COURSE_IDS.has(module.course_id)) {
        setLastWriteError(
          toWriteError(
            'recordLessonProgress',
            new Error(`Cannot record progress for unsupported course id "${module.course_id}" in supabase mode.`),
          ),
        );
        return;
      }

      if (!enrollment) {
        setLastWriteError(toWriteError('recordLessonProgress', new Error('No enrollment found for the signed-in user.')));
        return;
      }

      const enrollmentId = enrollment.id;
      const nextTimeSpent = (existingSnapshot?.time_spent_seconds || 0) + timeSpent;
      const nextCompletedAt = status === 'completed' ? now : existingSnapshot?.completed_at;

      setLessonProgress((prev) => {
        const existing = prev[lessonId];

        if (existing?.status === 'completed' && status === 'completed') {
          return prev;
        }

        return {
          ...prev,
          [lessonId]: {
            id: `lp-${lessonId}`,
            enrollment_id: enrollmentId,
            lesson_id: lessonId,
            status,
            time_spent_seconds: (existing?.time_spent_seconds || 0) + timeSpent,
            completed_at: status === 'completed' ? now : existing?.completed_at,
          },
        };
      });

      if (dataSource === 'supabase') {
        void import('@/integrations/supabase/mutations')
          .then(({ upsertLessonProgress }) =>
            upsertLessonProgress({
              enrollment_id: enrollmentId,
              lesson_id: lessonId,
              user_id: enrollment.user_id,
              status,
              time_spent_seconds: nextTimeSpent,
              completed_at: nextCompletedAt,
            }),
          )
          .then(() => setLastWriteError(null))
          .catch((error: unknown) => {
            setLessonProgress((prev) => {
              if (!existingSnapshot) {
                const next = { ...prev };
                delete next[lessonId];
                return next;
              }

              return {
                ...prev,
                [lessonId]: existingSnapshot,
              };
            });

            if (userId) {
              void supabaseDataProvider
                .getProgressForUser(userId)
                .then((progressRows) => {
                  setLessonProgress(Object.fromEntries(progressRows.map((progress) => [progress.lesson_id, progress])));
                })
                .catch(() => undefined);
            }

            setLastWriteError(toWriteError('upsertLessonProgress', error));
          });

        const isAcknowledgmentLesson = lesson?.lesson_type === 'acknowledgment' || lessonId.includes('acknowledgment');
        if (status === 'completed' && isAcknowledgmentLesson) {
          const statementText = lesson?.content.type === 'acknowledgment' ? lesson.content.statement_markdown : '';
          void import('@/integrations/supabase/mutations')
            .then(({ insertAcknowledgment }) =>
              insertAcknowledgment({
                enrollment_id: enrollmentId,
                lesson_id: lessonId,
                statement_text: statementText,
              }),
            )
            .then(() => setLastWriteError(null))
            .catch((error: unknown) => setLastWriteError(toWriteError('insertAcknowledgment', error)));
        }
      }
    },
    [dataSource, lessonProgress, realEnrollments, userId]
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
    if (dataSource === 'supabase') {
      return realEnrollments.find((enrollment) => enrollment.course_id === DEMO_HR_BASICS_COURSE.id) ?? realEnrollments[0] ?? null;
    }

    const summary = getProgressSummary(DEMO_HR_BASICS_COURSE.id);
    return {
      ...DEMO_HR_BASICS_ENROLLMENT,
      progress_percentage: summary.percentage,
    };
  }, [dataSource, getProgressSummary, realEnrollments]);

  const orientationEnrollment = useMemo<Enrollment>(() => {
    const summary = getProgressSummary(DEMO_ORIENTATION_COURSE.id);
    return {
      ...DEMO_ENROLLMENT,
      progress_percentage: summary.percentage,
    };
  }, [getProgressSummary]);

  const getMyEnrollments = useCallback((): Enrollment[] => {
    if (dataSource === 'supabase') {
      return realEnrollments;
    }

    return currentEnrollment ? [currentEnrollment, orientationEnrollment] : [orientationEnrollment];
  }, [currentEnrollment, dataSource, orientationEnrollment, realEnrollments]);

  const getCourse = useCallback((courseId: UUID): Course | undefined => {
    if (dataSource === 'supabase' && !DEMO_COURSE_IDS.has(courseId)) {
      return undefined;
    }

    if (courseId === DEMO_ORIENTATION_COURSE.id) {
      return DEMO_ORIENTATION_COURSE;
    }

    if (courseId === DEMO_HR_BASICS_COURSE.id) {
      return DEMO_HR_BASICS_COURSE;
    }

    return undefined;
  }, [dataSource]);

  const getModule = useCallback((moduleId: UUID): Module | undefined => {
    if (dataSource === 'supabase' && !DEMO_MODULE_IDS.has(moduleId)) {
      return undefined;
    }

    return DEMO_MODULES.find((m) => m.id === moduleId);
  }, [dataSource]);

  const getLessonsForModule = useCallback((moduleId: UUID): Lesson[] => {
    if (dataSource === 'supabase' && !DEMO_MODULE_IDS.has(moduleId)) {
      return [];
    }

    return ALL_DEMO_LESSONS.filter((l) => l.module_id === moduleId);
  }, [dataSource]);

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
      lastWriteError,
      clearLastWriteError,
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
      lastWriteError,
      clearLastWriteError,
      completeLesson,
      getLessonStatus,
      getDemoCourse,
      getDemoModule,
      getDemoLessons,
    ]
  );

  return <EducationContext.Provider value={value}>{children}</EducationContext.Provider>;
}
