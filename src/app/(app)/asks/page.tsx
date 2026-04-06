import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getMyAsks } from '@/lib/actions/ask';
import { AskCard } from '@/components/asks/ask-card';
import { buttonVariants } from '@/components/ui/button';

export default async function AsksPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { data: asks, error } = await getMyAsks();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your Asks</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Standing asks that actively work in the background.
          </p>
        </div>
        <Link href="/asks/new" className={buttonVariants({ variant: 'default' })}>
          New Ask
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {error && <p className="text-destructive text-sm">{error}</p>}

        {asks && asks.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No asks yet. Post your first ask to start getting matched.
            </p>
          </div>
        )}

        {asks?.map((ask) => (
          <AskCard key={ask.id} ask={ask} />
        ))}
      </div>
    </div>
  );
}
