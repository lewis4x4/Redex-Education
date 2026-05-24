import { describe, expect, it } from 'vitest';
import { moduleBasicsSchema } from './foundrySchemas';
import { formatAudienceForAi } from '@/features/foundry/lib/audienceFormat';

const baseInput = {
  title: 'Safety Basics',
  parent_course_id: 'standalone',
  audience_archetype: 'new_hire' as const,
  audience_refinement: '',
  completion_required: 'recommended' as const,
  training_type: 'safety' as const,
  learning_outcomes: [{ id: 'outcome-1', text: 'Apply safety practices in daily tasks' }],
  estimated_minutes: 30,
};

describe('moduleBasicsSchema', () => {
  it('validates 1-3 learning outcomes', () => {
    expect(moduleBasicsSchema.safeParse(baseInput).success).toBe(true);

    expect(
      moduleBasicsSchema.safeParse({
        ...baseInput,
        learning_outcomes: [
          { id: 'outcome-1', text: 'Apply safety practices in daily tasks' },
          { id: 'outcome-2', text: 'Report incidents using the required process' },
          { id: 'outcome-3', text: 'Locate emergency resources quickly' },
        ],
      }).success,
    ).toBe(true);

    expect(moduleBasicsSchema.safeParse({ ...baseInput, learning_outcomes: [] }).success).toBe(false);
    expect(
      moduleBasicsSchema.safeParse({
        ...baseInput,
        learning_outcomes: [
          { id: 'outcome-1', text: 'Apply safety practices in daily tasks' },
          { id: 'outcome-2', text: 'Report incidents using the required process' },
          { id: 'outcome-3', text: 'Locate emergency resources quickly' },
          { id: 'outcome-4', text: 'Identify escalation channels for urgent issues' },
        ],
      }).success,
    ).toBe(false);
  });

  it('supports completion_required recommended', () => {
    const result = moduleBasicsSchema.parse(baseInput);
    expect(result.completion_required).toBe('recommended');
  });
});

describe('formatAudienceForAi', () => {
  it('combines archetype label and refinement', () => {
    expect(
      formatAudienceForAi({
        audience_archetype: 'new_hire',
        audience_refinement: 'North America',
      }),
    ).toBe('New hires (North America)');

    expect(
      formatAudienceForAi({
        audience_archetype: 'customer_support',
        audience_refinement: '',
      }),
    ).toBe('Customer support');
  });
});
