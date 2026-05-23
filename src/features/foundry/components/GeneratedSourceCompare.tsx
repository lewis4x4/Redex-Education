import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { AlertOctagon } from 'lucide-react';

import {
  CONFIDENCE_LABELS,
  type LessonReviewItem,
  type LessonType,
  type QuizQuestion,
} from '@/lib/education';
import { GeneratedAssessmentPreview } from './GeneratedAssessmentPreview';
import { SourceReferencePanel } from './SourceReferencePanel';

export interface GeneratedSourceCompareProps {
  review: LessonReviewItem;
  generatedContent: {
    body_markdown?: string;
    quiz_questions?: QuizQuestion[];
    acknowledgment_text?: string;
    lesson_type: LessonType;
  };
}

const CONFIDENCE_STYLES = {
  high: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-slate-200 bg-slate-100 text-slate-700',
  unsupported: 'border-red-200 bg-red-50 text-red-700',
} as const;

export function GeneratedSourceCompare({ review, generatedContent }: GeneratedSourceCompareProps) {
  return (
    <section className="space-y-4" aria-label="Generated and source comparison">
      <div className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide uppercase">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 ${CONFIDENCE_STYLES[review.confidence]}`}>
          {CONFIDENCE_LABELS[review.confidence]}
        </span>
      </div>

      {review.has_unsupported_claim && (
        <aside className="rounded-xl border border-red-200 bg-red-50 p-4" role="alert" aria-live="polite">
          <div className="flex items-start gap-3">
            <AlertOctagon className="mt-0.5 h-5 w-5 text-red-700" aria-hidden="true" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-red-800">Unsupported claim</h3>
              <p className="text-sm text-red-700">{review.unsupported_note ?? 'This lesson includes unsupported content.'}</p>
            </div>
          </div>
        </aside>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section
          className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4"
          aria-labelledby="generated-content-title"
        >
          <h2 id="generated-content-title" className="text-lg font-semibold tracking-tight text-slate-900">
            Generated content
          </h2>

          {(generatedContent.lesson_type === 'text' || generatedContent.lesson_type === 'checklist') && (
            <div className="prose max-w-none text-slate-700">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{generatedContent.body_markdown ?? ''}</ReactMarkdown>
            </div>
          )}

          {generatedContent.lesson_type === 'quiz' && (
            <GeneratedAssessmentPreview questions={generatedContent.quiz_questions ?? []} />
          )}

          {generatedContent.lesson_type === 'acknowledgment' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{generatedContent.acknowledgment_text ?? ''}</p>
            </div>
          )}
        </section>

        <SourceReferencePanel excerpts={review.source_excerpts} />
      </div>
    </section>
  );
}
