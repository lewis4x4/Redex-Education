import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

import type { HotspotLessonContent, UUID } from '@/lib/education';

interface HotspotLessonProps {
  content: HotspotLessonContent;
}

function clampCoordinate(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function isMissingCoreContent(content: HotspotLessonContent): boolean {
  return content.image_ref.url.trim().length === 0 || content.image_ref.alt_text.trim().length === 0;
}

export function HotspotLesson({ content }: HotspotLessonProps) {
  const [selectedHotspotId, setSelectedHotspotId] = useState<UUID | null>(content.hotspots[0]?.id ?? null);

  const selectedHotspot = useMemo(
    () => content.hotspots.find((hotspot) => hotspot.id === selectedHotspotId) ?? null,
    [content.hotspots, selectedHotspotId],
  );

  if (isMissingCoreContent(content)) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[3px] text-amber-700">Hotspot diagram unavailable</p>
        <p className="mt-3 text-sm text-amber-900">This lesson is missing a valid image URL or alt text.</p>
      </div>
    );
  }

  if (content.hotspots.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[3px] text-amber-700">Hotspot diagram unavailable</p>
        <p className="mt-3 text-sm text-amber-900">This lesson has no hotspots configured yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      {content.intro_markdown?.trim() ? (
        <div className="prose max-w-none text-slate-700">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content.intro_markdown}</ReactMarkdown>
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-slate-200 bg-redex-offwhite p-4">
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white">
          <img src={content.image_ref.url} alt={content.image_ref.alt_text} className="h-auto w-full" />
          {content.hotspots.map((hotspot, index) => (
            <button
              key={hotspot.id}
              type="button"
              aria-label={`Open hotspot: ${hotspot.title}`}
              aria-pressed={selectedHotspotId === hotspot.id}
              className="absolute inline-flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-redex-red text-sm font-bold text-white shadow-md ring-offset-2 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-redex-red"
              style={{
                left: `${clampCoordinate(hotspot.x) * 100}%`,
                top: `${clampCoordinate(hotspot.y) * 100}%`,
              }}
              onClick={() => setSelectedHotspotId(hotspot.id)}
            >
              {index + 1}
            </button>
          ))}
        </div>
        {content.image_ref.caption?.trim() ? <p className="mt-3 text-sm text-slate-600">{content.image_ref.caption}</p> : null}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-redex-offwhite p-4" role="region" aria-label="Hotspot list">
        <p className="text-xs font-semibold uppercase tracking-[2px] text-slate-500">Hotspot list</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {content.hotspots.map((hotspot) => (
            <button
              key={`list-${hotspot.id}`}
              type="button"
              className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-redex-red hover:text-redex-red"
              aria-pressed={selectedHotspotId === hotspot.id}
              onClick={() => setSelectedHotspotId(hotspot.id)}
            >
              {hotspot.title}
            </button>
          ))}
        </div>
      </div>

      {selectedHotspot ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[2px] text-redex-red">Selected hotspot</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{selectedHotspot.title}</h3>
          <div className="prose mt-3 max-w-none text-slate-700">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{selectedHotspot.details_markdown}</ReactMarkdown>
          </div>
          {selectedHotspot.source_section_id ? (
            <p className="mt-3 text-xs font-medium text-slate-500">Source section: {selectedHotspot.source_section_id}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
