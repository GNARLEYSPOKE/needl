import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAskWithMatches } from '@/lib/actions/ask';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';

interface AskDetailPageProps {
  params: Promise<{ askId: string }>;
}

export default async function AskDetailPage({ params }: AskDetailPageProps) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { askId } = await params;
  const { data, error } = await getAskWithMatches(askId);

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <p className="text-muted-foreground">Ask not found.</p>
      </div>
    );
  }

  const { ask, matches } = data;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link
        href="/asks"
        className="text-muted-foreground mb-4 inline-block text-sm hover:underline"
      >
        ← Back to asks
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">Your Ask</CardTitle>
            <Badge>{ask.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{ask.body}</p>
          {ask.geography_filter.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {ask.geography_filter.map((geo) => (
                <Badge key={geo} variant="outline" className="text-xs">
                  {geo}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-muted-foreground text-xs">
            Posted {new Date(ask.created_at).toLocaleDateString()} ·{' '}
            {ask.visibility === 'network' ? 'Network' : 'Chapter'} visibility
          </p>
        </CardContent>
      </Card>

      <h2 className="mt-8 text-lg font-semibold">Matches ({matches.length})</h2>

      {matches.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          No matches yet. Needl is actively searching the network for you.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {matches.map((match) => {
            const initials = match.member_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            const scorePercent = Math.round(match.match_score * 100);

            return (
              <Card key={match.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={match.avatar_url ?? undefined} alt={match.member_name} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{match.member_name}</p>
                      <p className="text-muted-foreground text-sm">{match.company_name}</p>
                      {match.chapter_name && (
                        <p className="text-muted-foreground text-xs">{match.chapter_name}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {match.asker_action}
                    </Badge>
                  </div>

                  <p className="text-muted-foreground mt-2 text-sm">{match.tagline}</p>
                  <p className="mt-1 text-sm italic">{match.match_reason}</p>

                  <div className="mt-2">
                    <Progress value={scorePercent} />
                    <p className="text-muted-foreground mt-0.5 text-xs">{scorePercent}% match</p>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/introductions/request/${match.matched_member_id}?askId=${ask.id}&matchId=${match.id}`}
                      className={buttonVariants({ variant: 'default', size: 'sm' })}
                    >
                      Connect
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
