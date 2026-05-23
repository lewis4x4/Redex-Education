import { describe, expect, it } from 'vitest'

import { AUDIT_EVENT_TYPES } from '@/lib/education'
import { getEventBadgeVariant, getEventIcon, getEventLabel } from './eventLabels'

describe('audit event label helpers', () => {
  it('provides a label, icon, and badge variant for every event type', () => {
    const variants = ['neutral', 'progress', 'warning', 'success', 'danger', 'info']

    for (const type of AUDIT_EVENT_TYPES) {
      expect(getEventLabel(type)).toEqual(expect.any(String))
      expect(getEventLabel(type).length).toBeGreaterThan(0)
      expect(getEventIcon(type)).toEqual(expect.any(String))
      expect(getEventIcon(type).length).toBeGreaterThan(0)
      expect(variants).toContain(getEventBadgeVariant(type))
    }
  })
})
