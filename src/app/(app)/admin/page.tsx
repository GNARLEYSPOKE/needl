import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getNetworkOverview } from '@/lib/actions/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { data, error } = await getNetworkOverview();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Network Admin</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Overview of all chapters in your network.
      </p>

      {error && <p className="text-destructive mt-4 text-sm">{error}</p>}

      {data && (
        <>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-semibold">{data.chapters.length}</p>
                <p className="text-muted-foreground text-sm">Chapters</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-semibold">{data.totalMembers}</p>
                <p className="text-muted-foreground text-sm">Active Members</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-semibold text-amber-600">{data.totalAtRisk}</p>
                <p className="text-muted-foreground text-sm">At Risk</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Chapters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pr-4 pb-2 font-medium">Chapter</th>
                      <th className="pr-4 pb-2 text-center font-medium">Members</th>
                      <th className="pr-4 pb-2 text-center font-medium">At Risk</th>
                      <th className="pb-2 text-center font-medium">Billing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.chapters.map((c) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{c.name}</td>
                        <td className="py-3 pr-4 text-center">
                          <span className={c.isAtLimit ? 'font-medium text-amber-600' : ''}>
                            {c.memberCount}/25
                          </span>
                          {c.memberCount >= 25 && (
                            <Badge variant="destructive" className="ml-1 text-xs">
                              Full
                            </Badge>
                          )}
                          {c.memberCount >= 23 && c.memberCount < 25 && (
                            <Badge variant="outline" className="ml-1 text-xs text-amber-600">
                              Near limit
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-center">
                          {c.atRiskCount > 0 ? (
                            <span className="text-amber-600">{c.atRiskCount}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant={c.billingStatus === 'active' ? 'default' : 'destructive'}>
                            {c.billingStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
