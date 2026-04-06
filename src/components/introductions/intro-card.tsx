import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import type { Database } from '@/types/database';

type IntroRow = Database['public']['Tables']['introductions']['Row'];

interface IntroCardProps {
  intro: IntroRow & {
    requester_name: string;
    target_name: string;
    connector_name: string | null;
  };
  currentMemberId: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending_connector: 'Waiting on connector',
  pending_target: 'Waiting on target',
  connector_accepted: 'Intro made',
  connector_declined: 'Redirected',
  completed: 'Connected',
  declined: 'Declined',
  expired: 'Expired',
};

export function IntroCard({ intro, currentMemberId }: IntroCardProps) {
  const isRequester = intro.requester_member_id === currentMemberId;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {isRequester ? `You → ${intro.target_name}` : `${intro.requester_name} → You`}
            </p>
            {intro.connector_name && (
              <p className="text-muted-foreground text-xs">via {intro.connector_name}</p>
            )}
          </div>
          <Badge variant="outline">{STATUS_LABELS[intro.status] ?? intro.status}</Badge>
        </div>

        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">{intro.message}</p>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            {new Date(intro.created_at).toLocaleDateString()}
          </p>
          <Link
            href={`/introductions/${intro.id}`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            View
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
