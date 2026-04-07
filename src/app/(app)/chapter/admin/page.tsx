import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getChapterAdmin } from '@/lib/actions/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default async function ChapterAdminPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { data, error } = await getChapterAdmin();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        {data?.chapterName ?? 'Chapter'} Admin
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">Member engagement and health overview.</p>

      {error && <p className="text-destructive mt-4 text-sm">{error}</p>}

      {data && (
        <>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-semibold">{data.members.length}</p>
                <p className="text-muted-foreground text-sm">Members</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-semibold text-amber-600">
                  {data.members.filter((m) => m.isAtRisk).length}
                </p>
                <p className="text-muted-foreground text-sm">At Risk</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-semibold">{data.visitorCount}</p>
                <p className="text-muted-foreground text-sm">Visitors Invited</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.members.map((m) => (
                  <div
                    key={m.memberId}
                    className="flex items-center gap-4 border-b pb-3 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{m.fullName}</p>
                        {m.isAtRisk && (
                          <Badge variant="outline" className="text-xs text-amber-600">
                            At risk
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                        <span>{m.profileComplete ? '✓ Profile' : '✗ Profile'}</span>
                        <span>{m.onboardingComplete ? '✓ Onboarded' : '✗ Onboarding'}</span>
                        {m.expiresAt && (
                          <span>Expires {new Date(m.expiresAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-muted-foreground text-xs">{m.engagementScore}/100</p>
                      <Progress value={m.engagementScore} className="mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
