import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getChapterOnboardingStatus } from '@/lib/actions/onboarding';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ChapterOnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { data: members, error } = await getChapterOnboardingStatus();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Member Onboarding</h1>
      <p className="text-muted-foreground mt-1 text-sm">Track who has completed each step.</p>

      {error && <p className="text-destructive mt-4 text-sm">{error}</p>}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Chapter Members</CardTitle>
        </CardHeader>
        <CardContent>
          {members && members.length === 0 ? (
            <p className="text-muted-foreground text-sm">No chapter members found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pr-4 pb-2 font-medium">Member</th>
                    <th className="pr-4 pb-2 text-center font-medium">Profile</th>
                    <th className="pr-4 pb-2 text-center font-medium">First Ask</th>
                    <th className="pr-4 pb-2 text-center font-medium">First Search</th>
                    <th className="pb-2 text-center font-medium">First Intro</th>
                  </tr>
                </thead>
                <tbody>
                  {members?.map((m) => (
                    <tr key={m.memberId} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <p className="font-medium">{m.fullName}</p>
                        <p className="text-muted-foreground text-xs">
                          Joined {new Date(m.joinedAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-2 pr-4 text-center">{m.profileComplete ? '✓' : '—'}</td>
                      <td className="py-2 pr-4 text-center">{m.firstAskPosted ? '✓' : '—'}</td>
                      <td className="py-2 pr-4 text-center">{m.firstSearchRun ? '✓' : '—'}</td>
                      <td className="py-2 text-center">{m.firstIntroRequested ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
