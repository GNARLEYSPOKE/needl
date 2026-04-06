import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import type { MatchResult } from '@/lib/actions/search';

interface MatchResultCardProps {
  result: MatchResult;
}

export function MatchResultCard({ result }: MatchResultCardProps) {
  const initials = result.member_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const scorePercent = Math.round(result.match_score * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={result.avatar_url ?? undefined} alt={result.member_name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{result.member_name}</p>
            <p className="text-muted-foreground text-sm">{result.company_name}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{result.tagline}</p>

        <p className="text-muted-foreground text-sm italic">{result.match_reason}</p>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Match confidence</span>
            <span className="text-muted-foreground text-xs">{scorePercent}%</span>
          </div>
          <Progress value={scorePercent} />
        </div>

        {result.geography_served.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {result.geography_served.map((geo) => (
              <Badge key={geo} variant="outline" className="text-xs">
                {geo}
              </Badge>
            ))}
          </div>
        )}

        <Link
          href={`/profile/${result.member_id}`}
          className={buttonVariants({ variant: 'default', className: 'w-full' })}
        >
          Request Introduction
        </Link>
      </CardContent>
    </Card>
  );
}
