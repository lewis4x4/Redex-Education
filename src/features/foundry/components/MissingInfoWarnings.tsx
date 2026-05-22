import { AlertTriangle } from 'lucide-react';

export interface MissingInfoWarningsProps {
  notes: string[];
}

function renderNoteWithCode(note: string) {
  const parts = note.split(/(Drive ID\s+[A-Za-z0-9_-]+)/g);

  return parts.map((part, index) => {
    if (/^Drive ID\s+[A-Za-z0-9_-]+$/.test(part)) {
      return (
        <code key={`${part}-${index}`} className="rounded bg-amber-100 px-1 py-0.5 text-xs text-amber-900">
          {part}
        </code>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export function MissingInfoWarnings({ notes }: MissingInfoWarningsProps) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm text-amber-900"
      aria-labelledby="missing-source-heading"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="space-y-3">
          <h2 id="missing-source-heading" className="text-lg font-semibold tracking-tight">
            Missing source information
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-[1.45]">
            {notes.map((note) => (
              <li key={note}>{renderNoteWithCode(note)}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
