interface BreadcrumbBarProps {
  text: string;
}

export function BreadcrumbBar({ text }: BreadcrumbBarProps) {
  const segments = text
    .split('›')
    .map((segment) => segment.trim())
    .filter(Boolean);
  const breadcrumbItems = segments.length > 0 ? segments : [text];

  return (
    <div className="border-b bg-white/70 backdrop-blur-sm">
      <nav
        aria-label="Breadcrumb"
        className="max-w-[1200px] mx-auto px-6 py-2 text-sm text-slate-500"
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          {breadcrumbItems.map((segment, index) => {
            const isCurrent = index === breadcrumbItems.length - 1;

            return (
              <li key={`${segment}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && (
                  <span aria-hidden="true" className="text-slate-400">
                    ›
                  </span>
                )}
                <span
                  className={isCurrent ? 'font-medium text-slate-700' : undefined}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {segment}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
