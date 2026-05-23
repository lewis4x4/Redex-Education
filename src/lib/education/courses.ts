import type { Course, Lesson, Module } from '@/types/training'
import { getDataSource } from './dataSource'
import {
  DEMO_HR_BASICS_COURSE,
  DEMO_HR_BASICS_LESSONS,
  DEMO_LESSONS,
  DEMO_MODULES,
  DEMO_ORIENTATION_COURSE,
} from './demo-data'
import * as supabaseDataProvider from './supabaseDataProvider'

const MOCK_COURSES = [DEMO_ORIENTATION_COURSE, DEMO_HR_BASICS_COURSE]
const MOCK_LESSONS = [...DEMO_LESSONS, ...DEMO_HR_BASICS_LESSONS]

export async function getCourses(): Promise<Course[]> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getCourses()
  }

  return MOCK_COURSES
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getCourseById(courseId)
  }

  return MOCK_COURSES.find((course) => course.id === courseId) ?? null
}

export async function getModulesForCourse(courseId: string): Promise<Module[]> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getModulesForCourse(courseId)
  }

  return DEMO_MODULES.filter((module) => module.course_id === courseId)
}

export async function getLessonsForModule(moduleId: string): Promise<Lesson[]> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getLessonsForModule(moduleId)
  }

  return MOCK_LESSONS.filter((lesson) => lesson.module_id === moduleId)
}
