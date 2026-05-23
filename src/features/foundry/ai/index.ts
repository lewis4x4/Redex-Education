import { mockAiClient, mockInitialLessonReviews, mockLessonSourceBindings } from './mockAiClient';
import { realAiClient } from './realAiClient';
import type { CourseFoundryAiClient } from './courseFoundryAiClient';

export type AiMode = 'mock' | 'real';

export function getCourseFoundryAiMode(): AiMode {
  return import.meta.env.VITE_AI_MODE === 'real' ? 'real' : 'mock';
}

export function getCourseFoundryAiClient(): CourseFoundryAiClient {
  return getCourseFoundryAiMode() === 'real' ? realAiClient : mockAiClient;
}

export function getCourseFoundryLessonSourceBindings() {
  return getCourseFoundryAiMode() === 'real' ? {} : mockLessonSourceBindings;
}

export async function getCourseFoundryInitialLessonReviews() {
  if (getCourseFoundryAiMode() === 'real') {
    return [];
  }

  return mockInitialLessonReviews;
}

export type * from './courseFoundryAiClient';
export { mockAiClient } from './mockAiClient';
export { realAiClient } from './realAiClient';
