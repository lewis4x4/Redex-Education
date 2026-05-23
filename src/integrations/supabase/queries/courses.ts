import { supabase } from '@/integrations/supabase/client'
import {
  mapTrainingCourseRow,
  mapTrainingLessonRow,
  mapTrainingModuleRow,
} from '@/integrations/supabase/db-rows'
import type { Course, Lesson, Module } from '@/types/training'

export async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('training_courses')
    .select('*')
    .eq('status', 'published')
    .order('title', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapTrainingCourseRow)
}

export async function fetchCourseById(courseId: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('training_courses')
    .select('*')
    .eq('id', courseId)
    .maybeSingle()

  if (error) throw error
  return data === null ? null : mapTrainingCourseRow(data)
}

export async function fetchModulesForCourse(courseId: string): Promise<Module[]> {
  const { data, error } = await supabase
    .from('training_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapTrainingModuleRow)
}

export async function fetchLessonsForModule(moduleId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('training_lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapTrainingLessonRow)
}
