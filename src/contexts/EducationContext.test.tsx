// Redex Education domain context tests (Item C Phase 8)
import type { ReactNode } from 'react';
import { StrictMode } from 'react';
import { render, renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EducationProvider } from '@/contexts/EducationContext';
import { useEducation, useMyProgress } from '@/hooks/useEducation';
import {
  DEMO_HR_BASICS_COURSE,
  DEMO_HR_BASICS_ENROLLMENT,
  DEMO_HR_BASICS_LESSONS,
  DEMO_ORIENTATION_COURSE,
  DEMO_LESSONS,
} from '@/lib/education';

const STORAGE_KEY = 'redex-education-progress-v1';

function wrapper({ children }: { children: ReactNode }) {
  return <EducationProvider>{children}</EducationProvider>;
}

function strictWrapper({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <EducationProvider>{children}</EducationProvider>
    </StrictMode>
  );
}

describe('EducationContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('localStorage hydration', () => {
    it('hydrates from localStorage on first mount', () => {
      const firstLessonId = DEMO_LESSONS[0]!.id;

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lessonProgress: {
            [firstLessonId]: {
              status: 'completed',
              time_spent_seconds: 120,
              completed_at: '2026-05-22T00:00:00.000Z',
            },
          },
        })
      );

      const { result } = renderHook(() => useEducation(), { wrapper });

      expect(result.current.getLessonStatus(firstLessonId)).toBe('completed');
    });

    it('uses empty state when localStorage entry is missing', () => {
      const { result } = renderHook(() => useEducation(), { wrapper });

      expect(result.current.getLessonStatus('any-lesson-id')).toBe('not_started');
    });

    it('warns once and returns empty state for corrupt JSON', () => {
      localStorage.setItem(STORAGE_KEY, '{not valid json');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useEducation(), { wrapper });

      expect(result.current.getLessonStatus('any')).toBe('not_started');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]?.[0]).toContain('[EducationContext]');
    });
  });

  describe('StrictMode double-mount safety', () => {
    it("doesn't wipe hydrated progress under StrictMode", () => {
      const firstLessonId = DEMO_LESSONS[0]!.id;

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lessonProgress: {
            [firstLessonId]: {
              status: 'completed',
              time_spent_seconds: 90,
              completed_at: '2026-05-22T00:00:00.000Z',
            },
          },
        })
      );

      const { result } = renderHook(() => useEducation(), { wrapper: strictWrapper });

      expect(result.current.getLessonStatus(firstLessonId)).toBe('completed');
    });
  });

  describe('recordLessonProgress idempotency', () => {
    it('treats second completed call for same lesson as a no-op', () => {
      const { result } = renderHook(() => useEducation(), { wrapper });

      act(() => {
        result.current.recordLessonProgress('L1', 'completed', 120);
      });

      const refAfterFirstComplete = result.current;
      const persistedAfterFirst = localStorage.getItem(STORAGE_KEY);
      const parsedAfterFirst = JSON.parse(persistedAfterFirst ?? '{}');
      const firstProgress = parsedAfterFirst.lessonProgress?.L1;

      act(() => {
        result.current.recordLessonProgress('L1', 'completed', 60);
      });

      const refAfterSecondComplete = result.current;
      const persistedAfterSecond = localStorage.getItem(STORAGE_KEY);
      const parsedAfterSecond = JSON.parse(persistedAfterSecond ?? '{}');
      const secondProgress = parsedAfterSecond.lessonProgress?.L1;

      expect(refAfterSecondComplete).toBe(refAfterFirstComplete);
      expect(secondProgress.time_spent_seconds).toBe(120);
      expect(secondProgress.completed_at).toBe(firstProgress.completed_at);
      expect(persistedAfterSecond).toBe(persistedAfterFirst);
    });

    it('updates state when moving from in_progress to completed', () => {
      const { result } = renderHook(() => useEducation(), { wrapper });

      act(() => {
        result.current.recordLessonProgress('L1', 'in_progress', 30);
      });

      act(() => {
        result.current.recordLessonProgress('L1', 'completed', 60);
      });

      expect(result.current.getLessonStatus('L1')).toBe('completed');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      expect(stored.lessonProgress?.L1?.time_spent_seconds).toBe(90);
    });
  });

  describe('getProgressSummary(courseId) scoping', () => {
    it('returns course-scoped totals for orientation course', () => {
      const { result } = renderHook(() => useEducation(), { wrapper });

      expect(result.current.getProgressSummary(DEMO_ORIENTATION_COURSE.id)).toEqual({
        completed: 0,
        total: DEMO_LESSONS.length,
        percentage: 0,
      });
    });

    it('returns course-scoped totals for HR Basics course', () => {
      const { result } = renderHook(() => useEducation(), { wrapper });

      expect(result.current.getProgressSummary(DEMO_HR_BASICS_COURSE.id)).toEqual({
        completed: 0,
        total: DEMO_HR_BASICS_LESSONS.length,
        percentage: 0,
      });
    });

    it('advances HR Basics percentage after one completed lesson', () => {
      const { result } = renderHook(() => useEducation(), { wrapper });

      act(() => {
        result.current.recordLessonProgress(DEMO_HR_BASICS_LESSONS[0]!.id, 'completed');
      });

      const summary = result.current.getProgressSummary(DEMO_HR_BASICS_COURSE.id);
      expect(summary.completed).toBe(1);
      expect(summary.percentage).toBe(Math.round((1 / summary.total) * 100));
    });

    it('returns zeros for unknown courseId', () => {
      const { result } = renderHook(() => useEducation(), { wrapper });

      expect(result.current.getProgressSummary('not-a-real-course')).toEqual({
        completed: 0,
        total: 0,
        percentage: 0,
      });
    });
  });

  describe('persistence behavior', () => {
    it('writes updated progress to localStorage when recording progress', async () => {
      const { result } = renderHook(() => useEducation(), { wrapper });

      act(() => {
        result.current.recordLessonProgress('lesson-write', 'completed', 12);
      });

      await waitFor(() => {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
        expect(stored.lessonProgress['lesson-write'].status).toBe('completed');
      });
    });

    it('writes exactly once on initial mount with empty state', async () => {
      const setItemSpy = vi.spyOn(window.localStorage, 'setItem');

      render(
        <EducationProvider>
          <div>mount</div>
        </EducationProvider>
      );

      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledTimes(1);
      });
      expect(setItemSpy).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify({ lessonProgress: {} })
      );
    });
  });

  describe('provider stability', () => {
    it('updates HR Basics currentEnrollment.progress_percentage reactively via useMyProgress', () => {
      const { result } = renderHook(() => useMyProgress(), { wrapper });

      expect(result.current.enrollment?.course_id).toBe(DEMO_HR_BASICS_COURSE.id);
      expect(result.current.enrollment?.progress_percentage).toBe(0);

      act(() => {
        result.current.completeLesson(DEMO_HR_BASICS_LESSONS[0]!.id);
      });

      expect(result.current.enrollment?.progress_percentage).toBeGreaterThan(0);
    });

    it('returns HR Basics as Marcus primary enrollment while preserving Orientation as secondary', () => {
      const { result } = renderHook(() => useEducation(), { wrapper });

      const enrollments = result.current.getMyEnrollments();
      expect(enrollments[0]?.id).toBe(DEMO_HR_BASICS_ENROLLMENT.id);
      expect(enrollments[0]?.course_id).toBe(DEMO_HR_BASICS_COURSE.id);
      expect(enrollments.map((enrollment) => enrollment.course_id)).toContain(DEMO_ORIENTATION_COURSE.id);
    });
  });
});
