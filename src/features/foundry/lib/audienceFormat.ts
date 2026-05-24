import { CANONICAL_AUDIENCE_LABELS } from '@/lib/education';
import type { ModuleBasicsDraft } from '@/features/foundry/types';

export function formatAudienceForAi(basics: Pick<ModuleBasicsDraft, 'audience_archetype' | 'audience_refinement'>): string {
  const audienceArchetype = basics.audience_archetype ?? 'new_hire';
  const label = CANONICAL_AUDIENCE_LABELS[audienceArchetype];
  const refinement = basics.audience_refinement?.trim();

  return refinement ? `${label} (${refinement})` : label;
}
