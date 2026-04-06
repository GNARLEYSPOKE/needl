import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import type { Database } from '@/types/database';

type AskRow = Database['public']['Tables']['asks']['Row'];

interface AskCardProps {
  ask: AskRow & { match_count: number };
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  fulfilled: 'secondary',
  paused: 'outline',
  expired: 'outline',
};

export function AskCard({ ask }: AskCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-2">
          <p className="flex-1 text-sm">{ask.body}</p>
          <Badge variant={STATUS_VARIANT[ask.status] ?? 'outline'}>{ask.status}</Badge>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {ask.geography_filter.length > 0 &&
            ask.geography_filter.map((geo) => (
              <Badge key={geo} variant="outline" className="text-xs">
                {geo}
              </Badge>
            ))}
          <Badge variant="secondary" className="text-xs">
            {ask.visibility === 'network' ? 'Network' : 'Chapter'}
          </Badge>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            {ask.match_count} match{ask.match_count !== 1 ? 'es' : ''} ·{' '}
            {new Date(ask.created_at).toLocaleDateString()}
          </p>
          <Link
            href={`/asks/${ask.id}`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            View matches
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
