import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getMyIntroductions } from '@/lib/actions/introduction';
import { getCurrentMemberId } from '@/lib/actions/auth';
import { IntroCard } from '@/components/introductions/intro-card';

export default async function IntroductionsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const member = await getCurrentMemberId();
  const { data: intros, error } = await getMyIntroductions();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Introductions</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Track your introduction requests and connections.
      </p>

      <div className="mt-6 space-y-4">
        {error && <p className="text-destructive text-sm">{error}</p>}

        {intros && intros.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No introductions yet. Search for members and request an introduction.
            </p>
          </div>
        )}

        {intros?.map((intro) => (
          <IntroCard key={intro.id} intro={intro} currentMemberId={member.data?.memberId ?? ''} />
        ))}
      </div>
    </div>
  );
}
