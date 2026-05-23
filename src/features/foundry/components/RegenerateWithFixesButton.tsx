import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

export interface RegenerateWithFixesButtonProps {
  /** Number of un-ignored issues to fix. */
  issueCount: number;
  onRegenerate?: () => Promise<void> | void;
  disabled?: boolean;
}

export function RegenerateWithFixesButton({
  issueCount,
  onRegenerate,
  disabled = false,
}: RegenerateWithFixesButtonProps) {
  const isDisabled = issueCount === 0 || disabled;

  return (
    <Button
      type="button"
      variant="brand"
      size="lg"
      disabled={isDisabled}
      onClick={() => onRegenerate?.()}
      aria-label={`Regenerate with ${issueCount} fix${issueCount === 1 ? '' : 'es'}`}
      className="w-full justify-center"
    >
      <RefreshCw className="h-4 w-4" aria-hidden="true" />
      <span>Regenerate with {issueCount} fix{issueCount === 1 ? '' : 'es'}</span>
    </Button>
  );
}
