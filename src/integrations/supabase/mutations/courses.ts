import { supabase } from '@/integrations/supabase/client'
import {
  mapTrainingCourseRow,
  mapTrainingLessonRow,
  mapTrainingModuleRow,
} from '@/integrations/supabase/db-rows'
import type { Course, Lesson, Module } from '@/types/training'
import type { Json } from '@/integrations/supabase/types'
import { normalizeClientUUID, safeRetry } from './_idempotency'
import { requireMutationData, throwOnMutationError } from './_response'

export async function upsertCourse(course: Course): Promise<Course> {
  const result = await safeRetry(() =>
    supabase
      .from('training_courses')
      .upsert(
        {
          id: normalizeClientUUID(course.id, 'training_courses'),
          org_id: course.org_id,
          title: course.title,
          slug: course.slug,
          description: course.description ?? null,
          status: course.status,
          level: course.level,
          estimated_minutes: course.estimated_minutes,
          learning_objectives: course.learning_objectives as Json,
          created_at: course.created_at,
          updated_at: course.updated_at,
        },
        { onConflict: 'id' },
      )
      .select('*')
      .single(),
  )

  throwOnMutationError('upsert course', result.error)
  return mapTrainingCourseRow(requireMutationData('upsert course', result.data))
}

export async function upsertModule(module: Module): Promise<Module> {
  const result = await safeRetry(() =>
    supabase
      .from('training_modules')
      .upsert(
        {
          id: normalizeClientUUID(module.id, 'training_modules'),
          course_id: normalizeClientUUID(module.course_id, 'training_courses'),
          title: module.title,
          order_index: module.order_index,
          criticality: module.criticality,
          estimated_minutes: module.estimated_minutes,
          unlock_rule: module.unlock_rule ?? null,
        },
        { onConflict: 'id' },
      )
      .select('*')
      .single(),
  )

  throwOnMutationError('upsert module', result.error)
  return mapTrainingModuleRow(requireMutationData('upsert module', result.data))
}

export async function upsertLesson(lesson: Lesson): Promise<Lesson> {
  const result = await safeRetry(() =>
    supabase
      .from('training_lessons')
      .upsert(
        {
          id: normalizeClientUUID(lesson.id, 'training_lessons'),
          module_id: normalizeClientUUID(lesson.module_id, 'training_modules'),
          title: lesson.title,
          lesson_type: lesson.lesson_type,
          criticality: lesson.criticality,
          order_index: lesson.order_index,
          estimated_minutes: lesson.estimated_minutes,
          content: lesson.content as unknown as Json,
          resources: (lesson.resources ?? null) as Json | null,
        },
        { onConflict: 'id' },
      )
      .select('*')
      .single(),
  )

  throwOnMutationError('upsert lesson', result.error)
  return mapTrainingLessonRow(requireMutationData('upsert lesson', result.data))
}
