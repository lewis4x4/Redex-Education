import { Button } from '@/components/ui/button'

export function RouteErrorFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">Redex Education</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">We couldn’t load this page</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          A route chunk failed to load. This can happen after a new deploy or a brief network interruption.
        </p>
        <Button type="button" variant="brand" className="mt-6" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
    </div>
  )
}
