import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { GeneratedLessonContent } from '@/lib/education';
import { GeneratedAssessmentPreview } from './GeneratedAssessmentPreview';
import { GenerationStatusBadge } from './GenerationStatusBadge';

export interface GeneratedLessonPreviewProps {
  lesson: GeneratedLessonContent;
  onApprove?: () => void;
  onMarkNeedsReview?: () => void;
}

export function GeneratedLessonPreview({ lesson, onApprove, onMarkNeedsReview }: GeneratedLessonPreviewProps) {
  const hasActions = Boolean(onApprove || onMarkNeedsReview);

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white shadow-md p-6 md:p-8 space-y-6"
      aria-labelledby="generated-lesson-preview-title"
    >
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 id="generated-lesson-preview-title" className="text-xl font-semibold tracking-tight text-slate-900">
            {lesson.title}
          </h2>
          <GenerationStatusBadge status={lesson.status} note={lesson.status_note} />
        </div>

        {lesson.status_note && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="note">
            {lesson.status_note}
          </div>
        )}

        {lesson.source_refs && lesson.source_refs.length > 0 && (
          <p className="inline-flex items-center gap-2 text-sm text-slate-600">
            <FileText className="h-4 w-4 text-slate-500" aria-hidden="true" />
            📎 {lesson.source_refs.length} source references
          </p>
        )}
      </header>

      {(lesson.lesson_type === 'text' || lesson.lesson_type === 'checklist') && (
        <div className="prose max-w-none text-slate-700">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{lesson.body_markdown ?? ''}</ReactMarkdown>
        </div>
      )}

      {lesson.lesson_type === 'quiz' && (
        <GeneratedAssessmentPreview questions={lesson.quiz_questions ?? []} />
      )}

      {lesson.lesson_type === 'acknowledgment' && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-[15px] leading-[1.45] text-slate-700">{lesson.acknowledgment_text ?? ''}</p>
          <div className="space-y-2">
            <Button type="button" variant="outline" disabled aria-disabled="true" className="rounded-xl">
              Acknowledge
            </Button>
            <p className="text-xs text-slate-500">Available when published</p>
          </div>
        </div>
      )}

      {hasActions && (
        <footer className="flex flex-wrap gap-3 pt-2">
          {onApprove && (
            <Button type="button" variant="brand" onClick={onApprove}>
              Approve
            </Button>
          )}
          {onMarkNeedsReview && (
            <Button type="button" variant="outline" onClick={onMarkNeedsReview}>
              Mark needs review
            </Button>
          )}
        </footer>
      )}
    </section>
  );
}
