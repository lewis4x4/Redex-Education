import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

import { Button } from '@/components/ui/button';
import type { AcknowledgmentCompletion, AcknowledgmentLessonContent, UUID } from '@/lib/education';

interface AcknowledgmentLessonProps {
  lessonId: UUID;
  content: AcknowledgmentLessonContent;
  onAcknowledge?: (completion: AcknowledgmentCompletion) => void;
}

export function AcknowledgmentLesson({ lessonId, content, onAcknowledge }: AcknowledgmentLessonProps) {
  const signatureMethod = content.required_signature ?? 'click';
  const [isChecked, setIsChecked] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [completion, setCompletion] = useState<AcknowledgmentCompletion | null>(null);

  const trimmedName = typedName.trim();
  const canAcknowledge =
    completion === null && (signatureMethod === 'name' ? trimmedName.length > 0 : isChecked);

  const formattedAcknowledgedAt = useMemo(() => {
    if (!completion) {
      return null;
    }

    return new Date(completion.acknowledged_at).toLocaleString();
  }, [completion]);

  const checkboxId = `${lessonId}-acknowledgment-checkbox`;
  const signatureInputId = `${lessonId}-signature-input`;

  const handleAcknowledge = () => {
    if (!canAcknowledge) {
      return;
    }

    const payload: AcknowledgmentCompletion = {
      lesson_id: lessonId,
      signature_method: signatureMethod,
      acknowledged_at: new Date().toISOString(),
      policy_ref: content.policy_ref,
      ...(signatureMethod === 'name' ? { signature_text: trimmedName } : {}),
    };

    onAcknowledge?.(payload);
    setCompletion(payload);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      {content.policy_ref ? (
        <div className="rounded-xl border border-redex-red/20 bg-redex-offwhite p-3" role="note" aria-label="Policy reference">
          <p className="text-xs font-semibold uppercase tracking-[2px] text-redex-red">Policy reference</p>
          <p className="mt-1 text-sm font-medium text-slate-800">{content.policy_ref}</p>
        </div>
      ) : null}

      <div className="prose mt-5 max-w-none text-slate-700">
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content.statement_markdown}</ReactMarkdown>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-redex-offwhite p-4">
        {signatureMethod === 'name' ? (
          <div>
            <label htmlFor={signatureInputId} className="text-sm font-medium leading-6 text-slate-800">
              Type your full name as your signature
            </label>
            <input
              id={signatureInputId}
              type="text"
              value={typedName}
              onChange={(event) => setTypedName(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              placeholder="Full name"
              disabled={completion !== null}
            />
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <input
              id={checkboxId}
              type="checkbox"
              checked={isChecked}
              onChange={(event) => setIsChecked(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-redex-red focus:ring-redex-red"
              disabled={completion !== null}
            />
            <label htmlFor={checkboxId} className="text-sm font-medium leading-6 text-slate-800">
              I have read and understood this acknowledgment
            </label>
          </div>
        )}

        <Button
          type="button"
          className="mt-4 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          variant="brand"
          disabled={!canAcknowledge}
          onClick={handleAcknowledge}
        >
          {completion ? 'Acknowledged' : 'Acknowledge'}
        </Button>

        {completion && formattedAcknowledgedAt ? (
          <p className="mt-3 text-sm text-emerald-700">
            Acknowledged on <time dateTime={completion.acknowledged_at}>{formattedAcknowledgedAt}</time>
          </p>
        ) : null}
      </div>
    </div>
  );
}
