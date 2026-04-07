import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getChapterAsks } from '@/lib/actions/chapter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function ChapterAsksPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { data: asks, error } = await getChapterAsks();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Chapter Ask Board</h1>
      <p className="text-muted-foreground mt-1 text-sm">Active asks from your chapter members.</p>

      <div className="mt-6 space-y-4">
        {error && <p className="text-destructive text-sm">{error}</p>}

        {asks && asks.length === 0 && (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No active asks from chapter members yet.
          </p>
        )}

        {asks?.map((ask) => (
          <Card key={ask.id}>
            <CardContent className="pt-6">
              <p className="text-sm font-medium">{ask.member_name}</p>
              <p className="mt-1 text-sm">{ask.body}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {ask.geography_filter.map((geo) => (
                  <Badge key={geo} variant="outline" className="text-xs">
                    {geo}
                  </Badge>
                ))}
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                {new Date(ask.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
