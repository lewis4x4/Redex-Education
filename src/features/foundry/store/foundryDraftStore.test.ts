import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_GENERATED_MODULE } from '@/features/foundry/data/mockGeneratedModule'
import { MOCK_GENERATED_OUTLINE } from '@/features/foundry/data/mockGeneratedOutline'
import { MOCK_SELF_CRITIQUE } from '@/features/foundry/data/mockSelfCritique'
import { MOCK_LESSON_REVIEWS } from '@/features/foundry/data/mockLessonReviews'

function createStorageMock(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
  }
}

describe('useFoundryDraftStore', () => {
  let useFoundryDraftStore: (typeof import('./foundryDraftStore'))['useFoundryDraftStore']
  let useAuditLogStore: (typeof import('@/features/audit/store/auditLogStore'))['useAuditLogStore']
  let usePublishedModulesStore: (typeof import('@/features/publishing/store/publishedModulesStore'))['usePublishedModulesStore']
  let useModuleVersionsStore: (typeof import('@/features/publishing/store/moduleVersionsStore'))['useModuleVersionsStore']

  beforeEach(async () => {
    vi.resetModules()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ useAuditLogStore } = await import('@/features/audit/store/auditLogStore'))
    ;({ useModuleVersionsStore } = await import('@/features/publishing/store/moduleVersionsStore'))
    ;({ usePublishedModulesStore } = await import('@/features/publishing/store/publishedModulesStore'))
    ;({ useFoundryDraftStore } = await import('./foundryDraftStore'))

    act(() => {
      useAuditLogStore.getState().resetEvents()
      useModuleVersionsStore.getState().resetVersions()
      usePublishedModulesStore.getState().resetPublishedModules()
      useFoundryDraftStore.getState().clearDraft()
      useFoundryDraftStore.getState().clearSourceMaterial()
      useFoundryDraftStore.getState().clearSetupAnswers()
      useFoundryDraftStore.getState().clearOutline()
      useFoundryDraftStore.getState().clearGeneratedModule()
      useFoundryDraftStore.getState().clearCritique()
      useFoundryDraftStore.getState().clearLessonReviews()
      useFoundryDraftStore.getState().clearLibrarySelection()
    })
  })

  function seedPublishReadyModule(title = 'HR Basics at Redex') {
    useFoundryDraftStore.getState().setBasics({
      title,
      parent_course_id: 'standalone',
      audience: 'New hires',
      criticality: 'required',
      training_type: 'general_informational',
      estimated_minutes: 20,
    })
    useFoundryDraftStore.getState().setCritique({
      ...MOCK_SELF_CRITIQUE,
      blocks_publish: false,
      issues: MOCK_SELF_CRITIQUE.issues.map((issue) => ({ ...issue, ignored: true })),
    })
    useFoundryDraftStore
      .getState()
      .setLessonReviews(MOCK_LESSON_REVIEWS.map((review) => ({ ...review, status: 'approved' as const })))
  }

  it('starts with no current draft and draft publish state', () => {
    expect(useFoundryDraftStore.getState().currentDraft).toBeNull()
    expect(useFoundryDraftStore.getState().publishStatus).toBe('draft')
    expect(useFoundryDraftStore.getState().publishedAt).toBeNull()
  })

  it('setBasics stores form values and sets updated_at timestamp', () => {
    act(() => {
      useFoundryDraftStore.getState().setBasics({
        title: 'Field Safety Refresher',
        parent_course_id: 'standalone',
        audience: 'New hires',
        criticality: 'required',
        training_type: 'safety',
        estimated_minutes: 30,
      })
    })

    const draft = useFoundryDraftStore.getState().currentDraft
    expect(draft).toEqual(
      expect.objectContaining({
        title: 'Field Safety Refresher',
        parent_course_id: 'standalone',
        audience: 'New hires',
        criticality: 'required',
        training_type: 'safety',
        estimated_minutes: 30,
      }),
    )
    expect(typeof draft?.updated_at).toBe('string')
  })

  it('setBasics records module_created once for a new draft', () => {
    act(() => {
      useAuditLogStore.setState({ events: [] })
      useFoundryDraftStore.getState().setBasics({
        title: 'Field Safety Refresher',
        parent_course_id: 'standalone',
        audience: 'New hires',
        criticality: 'required',
        training_type: 'safety',
        estimated_minutes: 30,
      })
      useFoundryDraftStore.getState().setBasics({
        title: 'Field Safety Refresher Updated',
        parent_course_id: 'standalone',
        audience: 'New hires',
        criticality: 'required',
        training_type: 'safety',
        estimated_minutes: 35,
      })
    })

    expect(useAuditLogStore.getState().events.filter((event) => event.event_type === 'module_created')).toHaveLength(1)
  })

  it('clearDraft resets current draft to null', () => {
    act(() => {
      useFoundryDraftStore.getState().setBasics({
        title: 'Draft to clear',
        parent_course_id: 'standalone',
        audience: 'Field team',
        criticality: 'optional',
        training_type: 'operational',
        estimated_minutes: 20,
      })
    })

    act(() => {
      useFoundryDraftStore.getState().clearDraft()
    })

    expect(useFoundryDraftStore.getState().currentDraft).toBeNull()
  })

  it('persists draft state to localStorage', () => {
    act(() => {
      useFoundryDraftStore.getState().setBasics({
        title: 'Persist me',
        parent_course_id: 'course-001',
        audience: 'Managers',
        criticality: 'required',
        training_type: 'compliance',
        estimated_minutes: 40,
      })
    })

    const persisted = localStorage.getItem('redex-foundry-draft-v1')
    expect(persisted).not.toBeNull()

    const parsed = JSON.parse(persisted as string) as {
      state: { currentDraft: { title: string } }
      version: number
    }

    expect(parsed.version).toBe(0)
    expect(parsed.state.currentDraft.title).toBe('Persist me')
  })

  it('starts with sourceMaterial as null', () => {
    expect(useFoundryDraftStore.getState().sourceMaterial).toBeNull()
  })

  it('setSourceMaterial writes source material state', () => {
    act(() => {
      useFoundryDraftStore.getState().setSourceMaterial({
        id: 'source-1',
        title: 'Source one',
        type: 'markdown',
        raw_text: '# Intro',
        raw_text_preview: '# Intro',
        processing_status: 'processed',
        sections: [],
      })
    })

    expect(useFoundryDraftStore.getState().sourceMaterial).toEqual(
      expect.objectContaining({ id: 'source-1', title: 'Source one', type: 'markdown' }),
    )
  })

  it('clearSourceMaterial resets source material to null', () => {
    act(() => {
      useFoundryDraftStore.getState().setSourceMaterial({
        id: 'source-2',
        title: 'Clear me',
        type: 'markdown',
        processing_status: 'processed',
        sections: [],
      })
    })

    act(() => {
      useFoundryDraftStore.getState().clearSourceMaterial()
    })

    expect(useFoundryDraftStore.getState().sourceMaterial).toBeNull()
  })

  it('clearDraft does not clear sourceMaterial', () => {
    act(() => {
      useFoundryDraftStore.getState().setBasics({
        title: 'Draft',
        parent_course_id: 'standalone',
        audience: 'Ops',
        criticality: 'required',
        training_type: 'operational',
        estimated_minutes: 15,
      })
      useFoundryDraftStore.getState().setSourceMaterial({
        id: 'source-3',
        title: 'Independent source',
        type: 'markdown',
        processing_status: 'processed',
        sections: [],
      })
    })

    act(() => {
      useFoundryDraftStore.getState().clearDraft()
    })

    expect(useFoundryDraftStore.getState().currentDraft).toBeNull()
    expect(useFoundryDraftStore.getState().sourceMaterial).toEqual(
      expect.objectContaining({ id: 'source-3', title: 'Independent source' }),
    )
  })

  it('persists both currentDraft and sourceMaterial in localStorage payload', () => {
    act(() => {
      useFoundryDraftStore.getState().setBasics({
        title: 'Persist draft + source',
        parent_course_id: 'course-001',
        audience: 'Managers',
        criticality: 'required',
        training_type: 'compliance',
        estimated_minutes: 40,
      })
      useFoundryDraftStore.getState().setSourceMaterial({
        id: 'source-4',
        title: 'Persisted source',
        type: 'markdown',
        raw_text: '# Persisted source',
        processing_status: 'processed',
        sections: [],
      })
    })

    const persisted = localStorage.getItem('redex-foundry-draft-v1')
    expect(persisted).not.toBeNull()

    const parsed = JSON.parse(persisted as string) as {
      state: {
        currentDraft: { title: string }
        sourceMaterial: { title: string; type: string }
      }
    }

    expect(parsed.state.currentDraft.title).toBe('Persist draft + source')
    expect(parsed.state.sourceMaterial).toEqual(
      expect.objectContaining({ title: 'Persisted source', type: 'markdown' }),
    )
  })

  it('starts with setupAnswers as null', () => {
    expect(useFoundryDraftStore.getState().setupAnswers).toBeNull()
  })

  it('setSetupAnswers stores values and sets updated_at timestamp', () => {
    act(() => {
      useFoundryDraftStore.getState().setSetupAnswers({
        criticality: 'operational',
        assessment_style: 'standard_quiz',
        audience_notes: 'Field operators',
        experience_notes: 'Scenario walk-through',
        estimated_minutes: 30,
        source_control: 'strict',
        requires_admin_approval: true,
        requires_safety_review: false,
      })
    })

    const answers = useFoundryDraftStore.getState().setupAnswers
    expect(answers).toEqual(
      expect.objectContaining({
        criticality: 'operational',
        assessment_style: 'standard_quiz',
        audience_notes: 'Field operators',
      }),
    )
    expect(answers?.updated_at).toEqual(expect.any(String))
    expect(new Date(answers?.updated_at ?? '').toString()).not.toBe('Invalid Date')
  })

  it('clearSetupAnswers resets setupAnswers to null', () => {
    act(() => {
      useFoundryDraftStore.getState().setSetupAnswers({
        criticality: 'informational',
        assessment_style: 'light_quiz',
        audience_notes: 'Everyone',
        experience_notes: '',
        estimated_minutes: 20,
        source_control: 'flexible',
        requires_admin_approval: false,
        requires_safety_review: false,
      })
    })

    act(() => {
      useFoundryDraftStore.getState().clearSetupAnswers()
    })

    expect(useFoundryDraftStore.getState().setupAnswers).toBeNull()
  })

  it('starts with outline null and outline_status draft', () => {
    expect(useFoundryDraftStore.getState().outline).toBeNull()
    expect(useFoundryDraftStore.getState().outline_status).toBe('draft')
  })

  it('setOutline saves outline and resets outline_status to draft', () => {
    act(() => {
      useFoundryDraftStore.getState().regenerateOutlineStart()
    })

    expect(useFoundryDraftStore.getState().outline_status).toBe('regenerating')

    act(() => {
      useFoundryDraftStore.getState().setOutline(MOCK_GENERATED_OUTLINE)
    })

    expect(useFoundryDraftStore.getState().outline).toEqual(MOCK_GENERATED_OUTLINE)
    expect(useFoundryDraftStore.getState().outline_status).toBe('draft')
  })

  it('approveOutline only sets approved when outline exists', () => {
    act(() => {
      useFoundryDraftStore.getState().approveOutline()
    })

    expect(useFoundryDraftStore.getState().outline_status).toBe('draft')

    act(() => {
      useFoundryDraftStore.getState().setOutline(MOCK_GENERATED_OUTLINE)
      useFoundryDraftStore.getState().approveOutline()
    })

    expect(useFoundryDraftStore.getState().outline_status).toBe('approved')
  })

  it('records outline_generated once and outline_approved once', () => {
    act(() => {
      useAuditLogStore.setState({ events: [] })
      useFoundryDraftStore.getState().setOutline(MOCK_GENERATED_OUTLINE)
      useFoundryDraftStore.getState().setOutline(MOCK_GENERATED_OUTLINE)
      useFoundryDraftStore.getState().approveOutline()
      useFoundryDraftStore.getState().approveOutline()
    })

    expect(useAuditLogStore.getState().events.filter((event) => event.event_type === 'outline_generated')).toHaveLength(1)
    expect(useAuditLogStore.getState().events.filter((event) => event.event_type === 'outline_approved')).toHaveLength(1)
  })

  it('starts with generatedModule as null', () => {
    expect(useFoundryDraftStore.getState().generatedModule).toBeNull()
  })

  it('setGeneratedModule writes generated module preview', () => {
    act(() => {
      useFoundryDraftStore.getState().setGeneratedModule(MOCK_GENERATED_MODULE)
    })

    expect(useFoundryDraftStore.getState().generatedModule).toEqual(MOCK_GENERATED_MODULE)
  })

  it('updateLessonStatus updates the matching lesson status by lesson/module indices', () => {
    act(() => {
      useFoundryDraftStore.getState().setGeneratedModule(MOCK_GENERATED_MODULE)
      useFoundryDraftStore.getState().updateLessonStatus(5, 0, 'ready_for_approval')
    })

    const updatedLesson = useFoundryDraftStore
      .getState()
      .generatedModule?.lessons.find((lesson) => lesson.lesson_index === 5 && lesson.module_index === 0)

    expect(updatedLesson?.title).toBe('Final Quiz')
    expect(updatedLesson?.status).toBe('ready_for_approval')
  })

  it('clearGeneratedModule resets generatedModule to null', () => {
    act(() => {
      useFoundryDraftStore.getState().setGeneratedModule(MOCK_GENERATED_MODULE)
      useFoundryDraftStore.getState().clearGeneratedModule()
    })

    expect(useFoundryDraftStore.getState().generatedModule).toBeNull()
  })

  it('starts with critique as null', () => {
    expect(useFoundryDraftStore.getState().critique).toBeNull()
  })

  it('setCritique writes the critique report', () => {
    act(() => {
      useFoundryDraftStore.getState().setCritique(MOCK_SELF_CRITIQUE)
    })

    expect(useFoundryDraftStore.getState().critique).toEqual(MOCK_SELF_CRITIQUE)
  })

  it('ignoreIssue marks ignored, stores note, and recomputes blocks_publish to false when all high issues are ignored', () => {
    act(() => {
      useFoundryDraftStore.getState().setCritique(MOCK_SELF_CRITIQUE)
      useFoundryDraftStore.getState().ignoreIssue('critique-issue-001', 'Accepted by policy owner')
      useFoundryDraftStore.getState().ignoreIssue('critique-issue-002', 'Covered externally')
    })

    const critique = useFoundryDraftStore.getState().critique
    const ignoredIssue = critique?.issues.find((issue) => issue.id === 'critique-issue-001')

    expect(ignoredIssue?.ignored).toBe(true)
    expect(ignoredIssue?.ignored_note).toBe('Accepted by policy owner')
    expect(critique?.blocks_publish).toBe(false)
  })

  it('unignoreIssue restores issue and recomputes blocks_publish to true when high issue is active again', () => {
    act(() => {
      useFoundryDraftStore.getState().setCritique(MOCK_SELF_CRITIQUE)
      useFoundryDraftStore.getState().ignoreIssue('critique-issue-001', 'temp')
      useFoundryDraftStore.getState().ignoreIssue('critique-issue-002', 'temp')
      useFoundryDraftStore.getState().unignoreIssue('critique-issue-001')
    })

    const critique = useFoundryDraftStore.getState().critique
    const restoredIssue = critique?.issues.find((issue) => issue.id === 'critique-issue-001')

    expect(restoredIssue?.ignored).toBe(false)
    expect(restoredIssue?.ignored_note).toBeUndefined()
    expect(critique?.blocks_publish).toBe(true)
  })

  it('starts with lessonReviews as an empty array', () => {
    expect(useFoundryDraftStore.getState().lessonReviews).toEqual([])
  })

  it('setLessonReviews writes lesson review items', () => {
    act(() => {
      useFoundryDraftStore.getState().setLessonReviews(MOCK_LESSON_REVIEWS)
    })

    expect(useFoundryDraftStore.getState().lessonReviews).toEqual(MOCK_LESSON_REVIEWS)
  })

  it('approveLessonReview marks the matching lesson review approved', () => {
    act(() => {
      useFoundryDraftStore.getState().setLessonReviews(MOCK_LESSON_REVIEWS)
      useFoundryDraftStore.getState().approveLessonReview(2, 0)
    })

    const updated = useFoundryDraftStore
      .getState()
      .lessonReviews.find((item) => item.lesson_index === 2 && item.module_index === 0)

    expect(updated?.lesson_title).toBe('Payroll and Timekeeping Basics')
    expect(updated?.status).toBe('approved')
  })

  it('approveLessonReview records lesson_approved once per pending lesson', () => {
    act(() => {
      useAuditLogStore.setState({ events: [] })
      useFoundryDraftStore.getState().setLessonReviews(MOCK_LESSON_REVIEWS)
      useFoundryDraftStore.getState().approveLessonReview(2, 0)
      useFoundryDraftStore.getState().approveLessonReview(2, 0)
    })

    expect(useAuditLogStore.getState().events.filter((event) => event.event_type === 'lesson_approved')).toHaveLength(1)
  })

  it('isPublishBlocked follows unsupported pending claims and clears after approval', () => {
    act(() => {
      useFoundryDraftStore.getState().setLessonReviews(MOCK_LESSON_REVIEWS)
    })

    expect(useFoundryDraftStore.getState().isPublishBlocked()).toBe(true)

    act(() => {
      useFoundryDraftStore.getState().approveLessonReview(2, 0)
    })

    expect(useFoundryDraftStore.getState().isPublishBlocked()).toBe(false)
  })

  it('getPublishBlockers starts empty', () => {
    expect(useFoundryDraftStore.getState().getPublishBlockers()).toEqual([])
  })

  it('getPublishBlockers includes critique high-severity unignored issues with stable IDs', () => {
    act(() => {
      useFoundryDraftStore.getState().setCritique(MOCK_SELF_CRITIQUE)
    })

    const blockers = useFoundryDraftStore
      .getState()
      .getPublishBlockers()
      .filter((blocker) => blocker.source === 'critique_high_severity')

    expect(blockers.length).toBeGreaterThan(0)
    expect(blockers.map((blocker) => blocker.id)).toEqual(
      expect.arrayContaining(['critique-critique-issue-001', 'critique-critique-issue-002']),
    )
  })

  it('getPublishBlockers includes lesson unsupported-claim blockers for non-approved lessons', () => {
    const firstReview = MOCK_LESSON_REVIEWS[0]!

    act(() => {
      useFoundryDraftStore.getState().setLessonReviews([
        {
          ...firstReview,
          has_unsupported_claim: true,
          status: 'pending',
          lesson_index: 0,
          module_index: 1,
        },
      ])
    })

    const blockers = useFoundryDraftStore.getState().getPublishBlockers()

    expect(blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'lesson_unsupported_claim',
          id: 'lesson-unsupported-0-1',
        }),
      ]),
    )
  })

  it('setPublished is blocked while publish blockers remain', () => {
    let didPublish = true

    act(() => {
      useFoundryDraftStore.getState().setLessonReviews(MOCK_LESSON_REVIEWS)
      didPublish = useFoundryDraftStore.getState().setPublished()
    })

    expect(didPublish).toBe(false)
    expect(useFoundryDraftStore.getState().publishStatus).toBe('draft')
    expect(useFoundryDraftStore.getState().publishedAt).toBeNull()
  })

  it('setPublished marks approved drafts published, records timestamp, and registers assignable module', () => {
    let didPublish = false

    act(() => {
      seedPublishReadyModule()
      didPublish = useFoundryDraftStore.getState().setPublished()
    })

    expect(didPublish).toBe(true)
    expect(useFoundryDraftStore.getState().publishStatus).toBe('published')
    expect(useFoundryDraftStore.getState().publishedAt).toEqual(expect.any(String))
    expect(new Date(useFoundryDraftStore.getState().publishedAt ?? '').toString()).not.toBe('Invalid Date')
    expect(usePublishedModulesStore.getState().isAssignable('module-version-hr-basics-v1')).toBe(true)
    expect(usePublishedModulesStore.getState().getAllPublished()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          module_version_id: 'module-version-hr-basics-v1',
          title: 'HR Basics at Redex',
          published_by: 'system',
        }),
      ]),
    )
    expect(useModuleVersionsStore.getState().getLatestPublishedVersion('hr-basics-mod-001')).toEqual(
      expect.objectContaining({
        id: 'module-version-hr-basics-v1',
        module_id: 'hr-basics-mod-001',
        module_title: 'HR Basics at Redex',
        version_number: 1,
        status: 'published',
        approved_by: 'system',
      }),
    )
  })

  it('setPublished records module_published when publish succeeds', () => {
    act(() => {
      useAuditLogStore.setState({ events: [] })
      seedPublishReadyModule()
      useFoundryDraftStore.getState().setPublished()
    })

    expect(useAuditLogStore.getState().events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event_type: 'module_published', entity_label: 'HR Basics at Redex v1' }),
      ]),
    )
  })

  it('setPublished rejects drafts that are not approved yet', () => {
    let didPublish = true

    act(() => {
      useFoundryDraftStore.getState().setBasics({
        title: 'Basics-only draft',
        parent_course_id: 'standalone',
        audience: 'New hires',
        criticality: 'required',
        training_type: 'general_informational',
        estimated_minutes: 20,
      })
      didPublish = useFoundryDraftStore.getState().setPublished()
    })

    expect(didPublish).toBe(false)
    expect(useFoundryDraftStore.getState().publishStatus).toBe('draft')
    expect(usePublishedModulesStore.getState().isAssignable('module-version-basics-only-draft-v1')).toBe(false)
    expect(useModuleVersionsStore.getState().getVersionHistory('basics-only-draft-mod-001')).toEqual([])
  })

  it('setPublished assigns custom drafts a distinct module version id instead of overwriting HR Basics', () => {
    act(() => {
      seedPublishReadyModule('Field Safety Refresher')
      useFoundryDraftStore.getState().setPublished()
    })

    expect(usePublishedModulesStore.getState().getAllPublished()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          module_version_id: 'module-version-hr-basics-v1',
          title: 'HR Basics at Redex',
        }),
        expect.objectContaining({
          module_version_id: 'module-version-field-safety-refresher-v1',
          title: 'Field Safety Refresher',
        }),
      ]),
    )
    expect(usePublishedModulesStore.getState().isAssignable('module-version-field-safety-refresher-v1')).toBe(true)
    expect(useModuleVersionsStore.getState().getLatestPublishedVersion('field-safety-refresher-mod-001')).toEqual(
      expect.objectContaining({
        id: 'module-version-field-safety-refresher-v1',
        module_title: 'Field Safety Refresher',
        version_number: 1,
      }),
    )
  })

  it('forkNewDraftVersion leaves the published version untouched while seeding draft metadata', () => {
    let forkedId = ''

    act(() => {
      seedPublishReadyModule()
      useFoundryDraftStore.getState().setPublished()
      const forked = useModuleVersionsStore.getState().forkNewDraftVersion('module-version-hr-basics-v1')
      forkedId = forked.id
      useFoundryDraftStore.getState().resetFoundryDraft()
      useFoundryDraftStore.getState().seedDraftFromModuleVersion(forked)
    })

    expect(forkedId).toBe('module-version-hr-basics-v2')
    expect(useModuleVersionsStore.getState().versions.find((version) => version.id === 'module-version-hr-basics-v1')).toEqual(
      expect.objectContaining({
        status: 'published',
        version_number: 1,
        published_at: expect.any(String),
      }),
    )
    expect(useFoundryDraftStore.getState().currentDraft).toEqual(
      expect.objectContaining({
        id: 'module-version-hr-basics-v2',
        module_id: 'hr-basics-mod-001',
        version_number: 2,
        title: 'HR Basics at Redex',
      }),
    )
  })

  it('seedDraftFromModuleVersion records module_version_forked once per version id', () => {
    act(() => {
      useAuditLogStore.setState({ events: [] })
      seedPublishReadyModule()
      useFoundryDraftStore.getState().setPublished()
      const forked = useModuleVersionsStore.getState().forkNewDraftVersion('module-version-hr-basics-v1')
      useFoundryDraftStore.getState().seedDraftFromModuleVersion(forked)
      useFoundryDraftStore.getState().seedDraftFromModuleVersion(forked)
    })

    expect(useAuditLogStore.getState().events.filter((event) => event.event_type === 'module_version_forked')).toHaveLength(1)
  })

  it('review mutations reset a published draft back to draft status', () => {
    act(() => {
      seedPublishReadyModule()
      useFoundryDraftStore.getState().setPublished()
      useFoundryDraftStore.getState().rejectLessonReview(0, 0)
    })

    expect(useFoundryDraftStore.getState().publishStatus).toBe('draft')
    expect(useFoundryDraftStore.getState().publishedAt).toBeNull()
  })

  it('resetPublishStatus and resetFoundryDraft clear published state', () => {
    act(() => {
      seedPublishReadyModule()
      useFoundryDraftStore.getState().setGeneratedModule(MOCK_GENERATED_MODULE)
      useFoundryDraftStore.getState().setCritique({
        ...MOCK_SELF_CRITIQUE,
        blocks_publish: false,
        issues: MOCK_SELF_CRITIQUE.issues.map((issue) => ({ ...issue, ignored: true })),
      })
      useFoundryDraftStore
        .getState()
        .setLessonReviews(MOCK_LESSON_REVIEWS.map((review) => ({ ...review, status: 'approved' as const })))
      useFoundryDraftStore.getState().setPublished()
      useFoundryDraftStore.getState().resetPublishStatus()
    })

    expect(useFoundryDraftStore.getState().publishStatus).toBe('draft')
    expect(useFoundryDraftStore.getState().publishedAt).toBeNull()
    expect(useFoundryDraftStore.getState().currentDraft).not.toBeNull()

    act(() => {
      seedPublishReadyModule()
      useFoundryDraftStore.getState().setPublished()
      useFoundryDraftStore.getState().resetFoundryDraft()
    })

    expect(useFoundryDraftStore.getState().currentDraft).toBeNull()
    expect(useFoundryDraftStore.getState().generatedModule).toBeNull()
    expect(useFoundryDraftStore.getState().publishStatus).toBe('draft')
    expect(useFoundryDraftStore.getState().publishedAt).toBeNull()
  })

  it('starts with selectedLibraryFileIds as an empty array', () => {
    expect(useFoundryDraftStore.getState().selectedLibraryFileIds).toEqual([])
  })

  it('toggleLibraryFile adds when absent and removes when present', () => {
    act(() => {
      useFoundryDraftStore.getState().toggleLibraryFile('drive-file-1')
    })
    expect(useFoundryDraftStore.getState().selectedLibraryFileIds).toEqual(['drive-file-1'])

    act(() => {
      useFoundryDraftStore.getState().toggleLibraryFile('drive-file-1')
    })
    expect(useFoundryDraftStore.getState().selectedLibraryFileIds).toEqual([])
  })

  it('clearLibrarySelection resets selectedLibraryFileIds and persists the array', () => {
    act(() => {
      useFoundryDraftStore.getState().toggleLibraryFile('drive-file-1')
      useFoundryDraftStore.getState().toggleLibraryFile('drive-file-2')
    })

    let persisted = localStorage.getItem('redex-foundry-draft-v1')
    expect(persisted).not.toBeNull()
    let parsed = JSON.parse(persisted as string) as {
      state: { selectedLibraryFileIds: string[] }
    }
    expect(parsed.state.selectedLibraryFileIds).toEqual(['drive-file-1', 'drive-file-2'])

    act(() => {
      useFoundryDraftStore.getState().clearLibrarySelection()
    })

    expect(useFoundryDraftStore.getState().selectedLibraryFileIds).toEqual([])

    persisted = localStorage.getItem('redex-foundry-draft-v1')
    expect(persisted).not.toBeNull()
    parsed = JSON.parse(persisted as string) as {
      state: { selectedLibraryFileIds: string[] }
    }
    expect(parsed.state.selectedLibraryFileIds).toEqual([])
  })

  const dashboardDraft = {
    module_version_id: 'module-version-field-safety-refresher-v1',
    module_id: 'field-safety-refresher-mod-001',
    module_title: 'Field Safety Refresher',
    version_number: 1,
  }

  function setSetupAnswers() {
    useFoundryDraftStore.getState().setSetupAnswers({
      criticality: 'operational',
      assessment_style: 'standard_quiz',
      audience_notes: 'New hires',
      experience_notes: 'First week',
      estimated_minutes: 20,
      source_control: 'strict',
      requires_admin_approval: true,
      requires_safety_review: false,
    })
  }

  it('resumeDraftFromAdminItem seeds a fresh dashboard draft and routes to source', () => {
    let route = ''

    act(() => {
      route = useFoundryDraftStore.getState().resumeDraftFromAdminItem(dashboardDraft)
    })

    expect(route).toBe('/admin/foundry/source')
    expect(useFoundryDraftStore.getState().currentDraft).toEqual(
      expect.objectContaining({
        id: dashboardDraft.module_version_id,
        module_id: dashboardDraft.module_id,
        title: dashboardDraft.module_title,
        version_number: dashboardDraft.version_number,
        parent_course_id: 'standalone',
        audience: 'New hires',
      }),
    )
    expect(useFoundryDraftStore.getState().generatedModule).toBeNull()
    expect(useFoundryDraftStore.getState().critique).toBeNull()
    expect(useFoundryDraftStore.getState().lessonReviews).toEqual([])
    expect(useFoundryDraftStore.getState().publishStatus).toBe('draft')
  })

  it('resumeDraftFromAdminItem preserves same-draft source, setup, and outline state', () => {
    act(() => {
      useFoundryDraftStore.getState().resumeDraftFromAdminItem(dashboardDraft)
      useFoundryDraftStore.getState().toggleLibraryFile('drive-file-1')
      setSetupAnswers()
      useFoundryDraftStore.getState().setOutline(MOCK_GENERATED_OUTLINE)
      useFoundryDraftStore.getState().approveOutline()
    })

    const setupAnswers = useFoundryDraftStore.getState().setupAnswers
    const outline = useFoundryDraftStore.getState().outline
    let route = ''

    act(() => {
      route = useFoundryDraftStore.getState().resumeDraftFromAdminItem({
        ...dashboardDraft,
        module_version_id: 'alternate-version-id-same-module-and-number',
      })
    })

    expect(route).toBe('/admin/foundry/preview')
    expect(useFoundryDraftStore.getState().selectedLibraryFileIds).toEqual(['drive-file-1'])
    expect(useFoundryDraftStore.getState().setupAnswers).toBe(setupAnswers)
    expect(useFoundryDraftStore.getState().outline).toBe(outline)
    expect(useFoundryDraftStore.getState().outline_status).toBe('approved')
  })

  it('resumeDraftFromAdminItem returns the helper-inferred route for each draft stage', () => {
    const cases: Array<[string, () => void, string]> = [
      ['source', () => undefined, '/admin/foundry/source'],
      ['questions', () => useFoundryDraftStore.getState().toggleLibraryFile('drive-file-1'), '/admin/foundry/questions'],
      [
        'outline',
        () => {
          useFoundryDraftStore.getState().toggleLibraryFile('drive-file-1')
          setSetupAnswers()
        },
        '/admin/foundry/outline',
      ],
      [
        'preview',
        () => {
          useFoundryDraftStore.getState().toggleLibraryFile('drive-file-1')
          setSetupAnswers()
          useFoundryDraftStore.getState().setOutline(MOCK_GENERATED_OUTLINE)
          useFoundryDraftStore.getState().approveOutline()
        },
        '/admin/foundry/preview',
      ],
      [
        'critique',
        () => {
          useFoundryDraftStore.getState().toggleLibraryFile('drive-file-1')
          setSetupAnswers()
          useFoundryDraftStore.getState().setOutline(MOCK_GENERATED_OUTLINE)
          useFoundryDraftStore.getState().approveOutline()
          useFoundryDraftStore.getState().setGeneratedModule(MOCK_GENERATED_MODULE)
        },
        '/admin/foundry/critique',
      ],
      [
        'side-by-side',
        () => {
          useFoundryDraftStore.getState().toggleLibraryFile('drive-file-1')
          setSetupAnswers()
          useFoundryDraftStore.getState().setOutline(MOCK_GENERATED_OUTLINE)
          useFoundryDraftStore.getState().approveOutline()
          useFoundryDraftStore.getState().setGeneratedModule(MOCK_GENERATED_MODULE)
          useFoundryDraftStore.getState().setCritique({ ...MOCK_SELF_CRITIQUE, issues: [], blocks_publish: false })
        },
        '/admin/foundry/sidebyside',
      ],
      [
        'blockers',
        () => {
          useFoundryDraftStore.getState().toggleLibraryFile('drive-file-1')
          setSetupAnswers()
          useFoundryDraftStore.getState().setOutline(MOCK_GENERATED_OUTLINE)
          useFoundryDraftStore.getState().approveOutline()
          useFoundryDraftStore.getState().setGeneratedModule(MOCK_GENERATED_MODULE)
          useFoundryDraftStore.getState().setCritique({ ...MOCK_SELF_CRITIQUE, issues: [], blocks_publish: false })
          useFoundryDraftStore.getState().setLessonReviews(MOCK_LESSON_REVIEWS)
        },
        '/admin/foundry/blockers',
      ],
      [
        'published',
        () => {
          useFoundryDraftStore.getState().toggleLibraryFile('drive-file-1')
          setSetupAnswers()
          useFoundryDraftStore.getState().setOutline(MOCK_GENERATED_OUTLINE)
          useFoundryDraftStore.getState().approveOutline()
          useFoundryDraftStore.getState().setGeneratedModule(MOCK_GENERATED_MODULE)
          useFoundryDraftStore.getState().setCritique({ ...MOCK_SELF_CRITIQUE, issues: [], blocks_publish: false })
          useFoundryDraftStore
            .getState()
            .setLessonReviews(MOCK_LESSON_REVIEWS.map((review) => ({ ...review, status: 'approved' as const })))
          useFoundryDraftStore.setState({ publishStatus: 'published' })
        },
        '/admin/foundry/published',
      ],
    ]

    for (const [, seedStage, expectedRoute] of cases) {
      act(() => {
        useFoundryDraftStore.getState().resetFoundryDraft()
        useFoundryDraftStore.getState().resumeDraftFromAdminItem(dashboardDraft)
        seedStage()
      })

      let route = ''
      act(() => {
        route = useFoundryDraftStore.getState().resumeDraftFromAdminItem(dashboardDraft)
      })

      expect(route).toBe(expectedRoute)
    }
  })

  it('resumeDraftFromAdminItem does not record audit events', () => {
    act(() => {
      useAuditLogStore.setState({ events: [] })
    })

    act(() => {
      useFoundryDraftStore.getState().resumeDraftFromAdminItem(dashboardDraft)
    })

    expect(useAuditLogStore.getState().events).toEqual([])
  })
})

describe('useFoundryDraftStore Supabase dispatch', () => {
  async function loadStore(mode: 'mock' | 'supabase', createModuleDraft = vi.fn()) {
    vi.resetModules()
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })
    vi.doMock('@/lib/education/dataSource', () => ({ getDataSource: () => mode }))
    vi.doMock('@/integrations/supabase/mutations', () => ({
      createModuleDraft,
      saveSourceMaterial: vi.fn().mockResolvedValue({}),
      saveSetupAnswers: vi.fn().mockResolvedValue(undefined),
      saveGeneratedOutline: vi.fn().mockResolvedValue([]),
      saveGeneratedLessons: vi.fn().mockResolvedValue([]),
      publishModuleVersion: vi.fn().mockResolvedValue({}),
    }))

    const { useAuditLogStore } = await import('@/features/audit/store/auditLogStore')
    const { useModuleVersionsStore } = await import('@/features/publishing/store/moduleVersionsStore')
    const { usePublishedModulesStore } = await import('@/features/publishing/store/publishedModulesStore')
    const { useFoundryDraftStore } = await import('./foundryDraftStore')

    act(() => {
      useAuditLogStore.getState().resetEvents()
      useModuleVersionsStore.getState().resetVersions()
      usePublishedModulesStore.getState().resetPublishedModules()
      useFoundryDraftStore.getState().resetFoundryDraft()
    })

    return { useFoundryDraftStore, createModuleDraft }
  }

  const basics = {
    title: 'Supabase Safety',
    parent_course_id: 'standalone',
    audience: 'New hires',
    criticality: 'required' as const,
    training_type: 'safety' as const,
    estimated_minutes: 20,
  }

  it('does not persist basics in mock mode', async () => {
    const createModuleDraft = vi.fn().mockResolvedValue({ id: 'course-1' })
    const { useFoundryDraftStore } = await loadStore('mock', createModuleDraft)

    act(() => {
      useFoundryDraftStore.getState().setBasics(basics)
    })

    expect(createModuleDraft).not.toHaveBeenCalled()
  })

  it('persists basics in supabase mode and records returned course id', async () => {
    const createModuleDraft = vi.fn().mockResolvedValue({ id: 'course-1' })
    const { useFoundryDraftStore } = await loadStore('supabase', createModuleDraft)

    act(() => {
      useFoundryDraftStore.getState().setBasics(basics)
    })

    expect(useFoundryDraftStore.getState().currentDraft?.title).toBe('Supabase Safety')
    await vi.waitFor(() => {
      expect(createModuleDraft).toHaveBeenCalledWith(expect.objectContaining({ title: 'Supabase Safety' }))
    })
    await vi.waitFor(() => {
      expect(useFoundryDraftStore.getState().currentDraft?.persisted_course_id).toBe('course-1')
    })
  })

  it('sets lastWriteError when basics persistence fails', async () => {
    const createModuleDraft = vi.fn().mockRejectedValue(new Error('draft rejected'))
    const { useFoundryDraftStore } = await loadStore('supabase', createModuleDraft)

    act(() => {
      useFoundryDraftStore.getState().setBasics(basics)
    })

    await vi.waitFor(() => {
      expect(useFoundryDraftStore.getState().lastWriteError).toEqual(expect.objectContaining({ action: 'setBasics', message: 'draft rejected' }))
    })
  })
})
