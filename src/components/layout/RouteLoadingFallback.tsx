export function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    </div>
  )
}
