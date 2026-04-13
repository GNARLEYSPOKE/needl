import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getChapterAsks } from '@/lib/actions/chapter';
import { ChapterAsksList } from '@/components/chapter/chapter-asks-list';

export default async function ChapterAsksPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { data: asks, error } = await getChapterAsks();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Chapter Ask Board</h1>
      <p className="text-muted-foreground mt-1 text-sm">Active asks from your chapter members.</p>

      <div className="mt-6">
        {error && <p className="text-destructive text-sm">{error}</p>}

        {asks && asks.length === 0 && (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No active asks from chapter members yet.
          </p>
        )}

        {asks && asks.length > 0 && <ChapterAsksList asks={asks} />}
      </div>
    </div>
  );
}
