import { useContext } from 'react';
import { EducationContext } from '@/contexts/education-context';
import { DEMO_HR_BASICS_COURSE } from '@/lib/education';
import type { UUID } from '@/lib/education';

export function useEducation() {
  const context = useContext(EducationContext);

  if (context === undefined) {
    throw new Error('useEducation must be used within an EducationProvider');
  }

  return context;
}

export function useMyProgress(courseId?: UUID) {
  const education = useEducation();
  const id = courseId ?? DEMO_HR_BASICS_COURSE.id;
  const summary = education.getProgressSummary(id);

  return {
    ...summary,
    enrollment: education.currentEnrollment,
    completeLesson: education.completeLesson,
  };
}

export function useCurrentEnrollment() {
  const { currentEnrollment } = useEducation();
  return currentEnrollment;
}
