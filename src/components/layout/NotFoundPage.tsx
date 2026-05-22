import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6">
      <Card className="max-w-md bg-white text-center shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-[#6b7280]">
          <p>We couldn&apos;t find that Redex Education page.</p>
          <Button asChild className="bg-redex-red hover:bg-redex-red-hover">
            <Link to="/learn">Back to Redex Academy</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
