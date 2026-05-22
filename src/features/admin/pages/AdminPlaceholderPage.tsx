import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminPlaceholderPage() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <Card className="border-redex-red/20 bg-white text-center shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold">Redex AI Course Foundry</CardTitle>
          <CardDescription>Admin creation tools are coming soon.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-[#6b7280]">
          This protected placeholder establishes the /admin route shell without wiring real course creation yet.
        </CardContent>
      </Card>
    </div>
  );
}
