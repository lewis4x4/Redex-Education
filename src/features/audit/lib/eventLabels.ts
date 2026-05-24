import type { AuditEventType } from '@/types/training'

export type AuditEventBadgeVariant = 'neutral' | 'progress' | 'warning' | 'success' | 'danger' | 'info'

const EVENT_LABELS: Record<AuditEventType, string> = {
  module_created: 'Module created',
  source_uploaded: 'Source uploaded',
  outline_generated: 'Outline generated',
  outline_approved: 'Outline approved',
  module_generated: 'Module generated',
  self_critique_completed: 'Self-critique completed',
  lesson_approved: 'Lesson approved',
  module_published: 'Module published',
  module_version_forked: 'Module version forked',
  assignment_created: 'Assignment created',
  employee_completed_module: 'Employee completed module',
  quiz_attempted: 'Quiz attempted',
  source_change_detected: 'Source change detected',
  stale_lesson_regenerated: 'Stale lesson regenerated',
  user_onboarded: 'User onboarded',
}

const EVENT_ICONS: Record<AuditEventType, string> = {
  module_created: '＋',
  source_uploaded: '📄',
  outline_generated: '▦',
  outline_approved: '✓',
  module_generated: '⚙',
  self_critique_completed: '◇',
  lesson_approved: '✓',
  module_published: '↑',
  module_version_forked: '⑂',
  assignment_created: '→',
  employee_completed_module: '★',
  quiz_attempted: '?',
  source_change_detected: '!',
  stale_lesson_regenerated: '↻',
  user_onboarded: '👤',
}

const EVENT_BADGE_VARIANTS: Record<AuditEventType, AuditEventBadgeVariant> = {
  module_created: 'neutral',
  source_uploaded: 'info',
  outline_generated: 'progress',
  outline_approved: 'success',
  module_generated: 'progress',
  self_critique_completed: 'info',
  lesson_approved: 'success',
  module_published: 'success',
  module_version_forked: 'warning',
  assignment_created: 'info',
  employee_completed_module: 'success',
  quiz_attempted: 'progress',
  source_change_detected: 'warning',
  stale_lesson_regenerated: 'success',
  user_onboarded: 'info',
}

export function getEventLabel(type: AuditEventType): string {
  return EVENT_LABELS[type]
}

export function getEventIcon(type: AuditEventType): string {
  return EVENT_ICONS[type]
}

export function getEventBadgeVariant(type: AuditEventType): AuditEventBadgeVariant {
  return EVENT_BADGE_VARIANTS[type]
}
