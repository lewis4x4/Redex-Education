import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

import { Button } from '@/components/ui/button';
import type { ChecklistCompletion, ChecklistLessonContent, UUID } from '@/lib/education';

interface ChecklistLessonProps {
  lessonId: UUID;
  content: ChecklistLessonContent;
  onComplete?: (completion: ChecklistCompletion) => void;
}

export function ChecklistLesson({ lessonId, content, onComplete }: ChecklistLessonProps) {
  const [checkedItemIds, setCheckedItemIds] = useState<UUID[]>([]);
  const [expandedItemIds, setExpandedItemIds] = useState<UUID[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const requiresAll = content.require_all ?? true;
  const hasItems = content.items.length > 0;
  const allChecked = content.items.every((item) => checkedItemIds.includes(item.id));
  const canComplete = hasItems && (!requiresAll || allChecked);

  const checkedIdsInContentOrder = useMemo(
    () => content.items.map((item) => item.id).filter((itemId) => checkedItemIds.includes(itemId)),
    [content.items, checkedItemIds],
  );

  const toggleChecked = (itemId: UUID) => {
    setCheckedItemIds((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
  };

  const toggleDetails = (itemId: UUID) => {
    setExpandedItemIds((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
  };

  const handleComplete = () => {
    if (!canComplete || isSubmitted) {
      return;
    }

    onComplete?.({
      lesson_id: lessonId,
      checked_item_ids: checkedIdsInContentOrder,
      completed_at: new Date().toISOString(),
      require_all: requiresAll,
    });

    setIsSubmitted(true);
  };

  if (!hasItems) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[3px] text-amber-700">Checklist unavailable</p>
        <p className="mt-3 text-sm text-amber-900">This checklist lesson has no checklist items configured yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      {content.intro_markdown ? (
        <div className="prose max-w-none text-slate-700">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content.intro_markdown}</ReactMarkdown>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {content.items.map((item) => {
          const isChecked = checkedItemIds.includes(item.id);
          const hasDetails = Boolean(item.details_markdown?.trim());
          const isExpanded = expandedItemIds.includes(item.id);
          const checkboxId = `${lessonId}-${item.id}-checkbox`;
          const detailsId = `${lessonId}-${item.id}-details`;

          return (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-redex-offwhite p-4">
              <div className="flex items-start gap-3">
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleChecked(item.id)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-redex-red focus:ring-redex-red"
                />
                <div className="min-w-0 flex-1">
                  <label htmlFor={checkboxId} className="text-sm font-medium leading-6 text-slate-800">
                    {item.label}
                  </label>

                  {hasDetails ? (
                    <div className="mt-2">
                      <button
                        type="button"
                        className="text-xs font-semibold uppercase tracking-[2px] text-redex-red"
                        aria-expanded={isExpanded}
                        aria-controls={detailsId}
                        onClick={() => toggleDetails(item.id)}
                      >
                        {isExpanded ? 'Hide details' : 'Show details'}
                      </button>
                      {isExpanded ? (
                        <div id={detailsId} className="prose mt-2 max-w-none text-sm text-slate-700">
                          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{item.details_markdown}</ReactMarkdown>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        className="mt-6 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        variant="brand"
        disabled={!canComplete || isSubmitted}
        onClick={handleComplete}
      >
        {isSubmitted ? 'Checklist completed' : 'Complete checklist'}
      </Button>
    </div>
  );
}
