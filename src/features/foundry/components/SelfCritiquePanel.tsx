import { AlertOctagon, CheckCircle2 } from 'lucide-react';

import type { CritiqueIssue, SelfCritiqueReport } from '@/lib/education';

import { CritiqueIssueCard } from './CritiqueIssueCard';
import { RegenerateWithFixesButton } from './RegenerateWithFixesButton';

export interface SelfCritiquePanelProps {
  report: SelfCritiqueReport;
  onIgnoreIssue?: (issueId: string, note: string) => void;
  onUnignoreIssue?: (issueId: string) => void;
  onEditIssue?: (issue: CritiqueIssue) => void;
  onRegenerateAll?: () => Promise<void> | void;
}

const SEVERITY_ORDER = ['high', 'medium', 'low'] as const;

export function SelfCritiquePanel({
  report,
  onIgnoreIssue,
  onUnignoreIssue,
  onEditIssue,
  onRegenerateAll,
}: SelfCritiquePanelProps) {
  const grouped = {
    high: report.issues.filter((issue) => issue.severity === 'high'),
    medium: report.issues.filter((issue) => issue.severity === 'medium'),
    low: report.issues.filter((issue) => issue.severity === 'low'),
  };

  const unignoredIssueCount = report.issues.filter((issue) => !issue.ignored).length;
  const unresolvedHighCount = grouped.high.filter((issue) => !issue.ignored).length;

  if (report.issues.length === 0) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
        <p className="inline-flex items-center gap-2 text-base font-medium">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          ✓ No issues found. Looking good.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label="Self critique issues">
      {report.blocks_publish ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 shadow-sm">
          <p className="inline-flex items-center gap-2 text-sm font-semibold">
            <AlertOctagon className="h-4 w-4" aria-hidden="true" />
            🚫 Publish blocked
          </p>
          <p className="mt-1 text-sm">
            Resolve {unresolvedHighCount} high-severity issue{unresolvedHighCount === 1 ? '' : 's'} or mark them as
            ignored before publishing.
          </p>
        </div>
      ) : null}

      {SEVERITY_ORDER.map((severity) => {
        const issues = grouped[severity];
        if (issues.length === 0) return null;

        const label = `${severity.charAt(0).toUpperCase()}${severity.slice(1)} severity (${issues.length})`;

        return (
          <section key={severity} className="space-y-3" aria-label={label}>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">{label}</h3>
            <div className="space-y-3">
              {issues.map((issue) => (
                <CritiqueIssueCard
                  key={issue.id}
                  issue={issue}
                  onIgnore={
                    onIgnoreIssue
                      ? (note) => {
                          onIgnoreIssue(issue.id, note);
                        }
                      : undefined
                  }
                  onUnignore={
                    onUnignoreIssue
                      ? () => {
                          onUnignoreIssue(issue.id);
                        }
                      : undefined
                  }
                  onEditManually={
                    onEditIssue
                      ? () => {
                          onEditIssue(issue);
                        }
                      : undefined
                  }
                  onRegenerateWithFix={onRegenerateAll}
                />
              ))}
            </div>
          </section>
        );
      })}

      <RegenerateWithFixesButton issueCount={unignoredIssueCount} onRegenerate={onRegenerateAll} />
    </section>
  );
}
