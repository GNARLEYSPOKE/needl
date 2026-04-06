'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getIntroduction, respondToIntroduction } from '@/lib/actions/introduction';

const STATUS_LABELS: Record<string, string> = {
  pending_connector: 'Waiting on connector',
  pending_target: 'Waiting on target',
  connector_accepted: 'Introduction made',
  connector_declined: 'Connector declined',
  completed: 'Connected',
  declined: 'Declined',
  expired: 'Expired',
};

type IntroData = Awaited<ReturnType<typeof getIntroduction>>['data'];

export default function IntroDetailPage() {
  const { introId } = useParams<{ introId: string }>();
  const router = useRouter();
  const [intro, setIntro] = useState<IntroData>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getIntroduction(introId).then(({ data }) => {
      setIntro(data);
      setLoading(false);
    });
  }, [introId]);

  function handleRespond(response: 'accepted' | 'declined'): void {
    startTransition(async () => {
      try {
        const result = await respondToIntroduction({
          introductionId: introId,
          response,
        });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success(response === 'accepted' ? 'Introduction sent!' : 'Request declined');
        router.refresh();
        // Re-fetch
        const { data } = await getIntroduction(introId);
        setIntro(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to respond';
        toast.error(msg);
      }
    });
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (!intro) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <p className="text-muted-foreground">Introduction not found.</p>
      </div>
    );
  }

  const showConnectorActions =
    intro.currentUserRole === 'connector' && intro.status === 'pending_connector';
  const showTargetActions = intro.currentUserRole === 'target' && intro.status === 'pending_target';
  const isAccepted = intro.status === 'connector_accepted' || intro.status === 'completed';

  // Generate mailto link when accepted
  let mailtoLink: string | null = null;
  if (isAccepted) {
    const subject = encodeURIComponent(
      `Introduction: ${intro.requester.full_name} meet ${intro.target.full_name}`,
    );
    const body = encodeURIComponent(
      `Hi ${intro.target.full_name},\n\nI'm ${intro.requester.full_name} from ${intro.requester.company_name}.\n\n${intro.message}\n\nLooking forward to connecting.`,
    );
    mailtoLink = `mailto:${intro.target.email}?cc=${intro.requester.email}&subject=${subject}&body=${body}`;
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Introduction</h1>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">
              {intro.requester.full_name} → {intro.target.full_name}
            </CardTitle>
            <Badge variant="outline">{STATUS_LABELS[intro.status] ?? intro.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Requester
              </p>
              <p className="text-sm font-medium">{intro.requester.full_name}</p>
              <p className="text-muted-foreground text-xs">{intro.requester.company_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Target
              </p>
              <p className="text-sm font-medium">{intro.target.full_name}</p>
              <p className="text-muted-foreground text-xs">{intro.target.company_name}</p>
            </div>
          </div>

          {intro.connector && (
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Connector
              </p>
              <p className="text-sm">{intro.connector.full_name}</p>
            </div>
          )}

          <Separator />

          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Message
            </p>
            <p className="mt-1 text-sm">{intro.message}</p>
          </div>

          {intro.connector_note && (
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Connector Note
              </p>
              <p className="mt-1 text-sm">{intro.connector_note}</p>
            </div>
          )}

          <p className="text-muted-foreground text-xs">
            Created {new Date(intro.created_at).toLocaleDateString()}
            {intro.intro_sent_at &&
              ` · Intro sent ${new Date(intro.intro_sent_at).toLocaleDateString()}`}
          </p>

          {/* Connector actions */}
          {showConnectorActions && (
            <div className="flex gap-2">
              <Button onClick={() => handleRespond('accepted')} disabled={isPending}>
                {isPending ? 'Sending...' : 'Accept & Introduce'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleRespond('declined')}
                disabled={isPending}
              >
                Decline
              </Button>
            </div>
          )}

          {/* Target actions (direct request) */}
          {showTargetActions && (
            <div className="flex gap-2">
              <Button onClick={() => handleRespond('accepted')} disabled={isPending}>
                {isPending ? 'Accepting...' : 'Accept Connection'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleRespond('declined')}
                disabled={isPending}
              >
                Decline
              </Button>
            </div>
          )}

          {/* Mailto link when accepted */}
          {mailtoLink && (
            <a
              href={mailtoLink}
              className="bg-primary text-primary-foreground inline-block rounded-md px-4 py-2 text-sm"
            >
              Send Email to {intro.target.full_name}
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
