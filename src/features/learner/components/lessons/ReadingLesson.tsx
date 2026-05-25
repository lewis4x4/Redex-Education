import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

import type { ReadingLessonBlock, TextLessonContent } from '@/lib/education';

interface ReadingLessonProps {
  content: TextLessonContent;
}

function Markdown({ children, tone = 'light' }: { children: string; tone?: 'light' | 'dark' }) {
  const toneClasses = tone === 'dark' ? 'prose-invert text-slate-200' : 'text-slate-700';

  return (
    <div className={`prose max-w-none ${toneClasses}`}>
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{children}</ReactMarkdown>
    </div>
  );
}

function blockAnchorId(block: ReadingLessonBlock): string {
  if (block.kind === 'prose' && block.anchor_id) {
    return block.anchor_id;
  }

  return block.id;
}


function InlineCheckBlock({ block }: { block: Extract<ReadingLessonBlock, { kind: 'inline_check' }> }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex !== null;
  const isCorrect = selected && block.correct_option_index !== undefined && selectedIndex === block.correct_option_index;
  const isIncorrect = selected && block.correct_option_index !== undefined && selectedIndex !== block.correct_option_index;
  const feedback = isCorrect
    ? block.feedback_correct_markdown
    : isIncorrect
      ? block.feedback_incorrect_markdown
      : block.feedback_neutral_markdown;

  return (
    <section role="group" aria-labelledby={`${block.id}-prompt`} className="rounded-2xl border border-redex-red/20 bg-redex-red/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-[2px] text-redex-red">Quick check — not graded</p>
      <h4 id={`${block.id}-prompt`} className="mt-2 text-base font-semibold text-slate-900">{block.prompt}</h4>
      <div className="mt-4 grid gap-2">
        {block.options.map((option, index) => (
          <button
            key={`${block.id}-option-${index}`}
            type="button"
            aria-pressed={selectedIndex === index}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
              selectedIndex === index
                ? 'border-redex-red bg-white text-redex-red shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-redex-red/50 hover:text-redex-red'
            }`}
            onClick={() => setSelectedIndex(index)}
          >
            {option}
          </button>
        ))}
      </div>
      {feedback ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4" role="status" aria-live="polite">
          <Markdown>{feedback}</Markdown>
        </div>
      ) : selected ? (
        <p className="mt-3 text-sm text-slate-600" role="status" aria-live="polite">
          Response noted. This check is for practice and does not affect completion.
        </p>
      ) : null}
    </section>
  );
}

function CollapsibleBlock({ block }: { block: Extract<ReadingLessonBlock, { kind: 'collapsible' }> }) {
  const [open, setOpen] = useState(Boolean(block.default_open));
  const panelId = `${block.id}-panel`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <span>
          <span className="block text-xs font-semibold uppercase tracking-[2px] text-slate-500">Reference</span>
          <span className="mt-1 block text-base font-semibold text-slate-900">{block.title}</span>
        </span>
        <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600">
          {open ? 'Hide' : 'Show'}
        </span>
      </button>
      <div id={panelId} hidden={!open} className="mt-4 border-t border-slate-200 pt-4">
        <Markdown>{block.markdown}</Markdown>
      </div>
    </section>
  );
}

function ConfigBlock({ block }: { block: Extract<ReadingLessonBlock, { kind: 'config_block' }> }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'unavailable'>('idle');

  async function copyCode() {
    if (!navigator.clipboard?.writeText) {
      setCopyState('unavailable');
      return;
    }

    try {
      await navigator.clipboard.writeText(block.code);
      setCopyState('copied');
    } catch {
      setCopyState('unavailable');
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[2px] text-redex-red/80">Copyable config</p>
          {block.title ? <h4 className="mt-2 text-base font-semibold">{block.title}</h4> : null}
          {block.description_markdown ? (
            <div className="mt-2 text-sm text-slate-300">
              <Markdown tone="dark">{block.description_markdown}</Markdown>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:border-redex-red hover:text-redex-red"
          onClick={copyCode}
        >
          {copyState === 'copied' ? 'Copied' : block.copy_label ?? 'Copy'}
        </button>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-black/40 p-4 text-sm leading-6 text-slate-100"><code>{block.code}</code></pre>
      {copyState === 'unavailable' ? <p className="mt-2 text-xs text-slate-300">Copy unavailable. Select the code manually.</p> : null}
    </section>
  );
}

function ImageBlock({ block }: { block: Extract<ReadingLessonBlock, { kind: 'image' }> }) {
  const { image_ref } = block;
  const isReady = Boolean(image_ref.storage_url) && image_ref.status !== 'failed';
  const statusLabel = image_ref.status === 'failed' ? 'Image unavailable' : 'Image pending ingest';

  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {isReady ? (
        <img
          src={image_ref.storage_url}
          alt={image_ref.alt_text}
          loading="lazy"
          className="w-full rounded-xl border border-slate-200 object-cover"
        />
      ) : (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <div>
            <p className="text-sm font-semibold text-slate-900">{statusLabel}</p>
            <p className="mt-2 text-sm text-slate-600">{image_ref.alt_text}</p>
          </div>
        </div>
      )}
      <figcaption className="mt-3 text-sm font-medium text-slate-700">{image_ref.caption}</figcaption>
      <div className="mt-3 rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[2px] text-slate-500">Text equivalent</p>
        <div className="mt-2">
          <Markdown>{block.text_equivalent_markdown}</Markdown>
        </div>
      </div>
    </figure>
  );
}

function ReadingBlock({ block }: { block: ReadingLessonBlock }) {
  switch (block.kind) {
    case 'prose':
      return (
        <section id={blockAnchorId(block)} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          {block.heading ? (
            <h3 className="mb-4 text-xl font-semibold tracking-tight text-slate-900">
              {block.heading}
              <span className="ml-2 text-sm font-normal text-slate-400">#</span>
            </h3>
          ) : null}
          <Markdown>{block.markdown}</Markdown>
        </section>
      );
    case 'callout':
      return (
        <aside
          className={`rounded-2xl border bg-white p-5 shadow-sm ${
            block.tone === 'key_takeaway' ? 'border-redex-red/25 border-l-4 border-l-redex-red' : 'border-slate-200 border-l-4 border-l-slate-400'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[2px] text-redex-red">
            {block.tone === 'key_takeaway' ? 'Key takeaway' : 'Note'}
          </p>
          {block.title ? <h4 className="mt-2 text-base font-semibold text-slate-900">{block.title}</h4> : null}
          <div className="mt-3">
            <Markdown>{block.markdown}</Markdown>
          </div>
        </aside>
      );
    case 'policy_quote':
      return (
        <blockquote className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[2px] text-slate-500">Policy quote</p>
          <div className="mt-3 border-l-4 border-redex-red pl-4 italic">
            <Markdown>{block.quote_markdown}</Markdown>
          </div>
          {block.attribution || block.policy_ref ? (
            <footer className="mt-3 text-sm font-medium text-slate-600">
              {block.attribution ? <span>{block.attribution}</span> : null}
              {block.attribution && block.policy_ref ? <span> · </span> : null}
              {block.policy_ref ? <span>{block.policy_ref}</span> : null}
            </footer>
          ) : null}
        </blockquote>
      );
    case 'inline_check':
      return <InlineCheckBlock block={block} />;
    case 'collapsible':
      return <CollapsibleBlock block={block} />;
    case 'config_block':
      return <ConfigBlock block={block} />;
    case 'image':
      return <ImageBlock block={block} />;
    default: {
      if (import.meta.env.DEV) {
        console.warn('Unhandled reading block variant', block);
      }

      return (
        <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="note">
          This content block isn't supported in your current version of Redex Academy. Refresh to load the latest update — the
          rest of the lesson will continue to work.
        </aside>
      );
    }
  }
}

export function ReadingLesson({ content }: ReadingLessonProps) {
  const blocks = content.blocks?.filter(Boolean) ?? [];

  if (blocks.length === 0) {
    const markdownBody = content.body_markdown?.trim();

    if (!markdownBody) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8" role="status">
          <p className="text-xs font-semibold uppercase tracking-[3px] text-amber-700">Lesson content unavailable</p>
          <p className="mt-3 text-sm text-amber-900">
            This reading lesson has no published content yet. Please contact your trainer or refresh the lesson.
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <Markdown>{markdownBody}</Markdown>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="reading-lesson-v2">
      {blocks.map((block) => (
        <ReadingBlock key={block.id} block={block} />
      ))}
    </div>
  );
}
