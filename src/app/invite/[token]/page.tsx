'use client';

import { useState, useTransition } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { rsvpByToken } from '@/lib/actions/visitor';

export default function RsvpPage() {
  const { token } = useParams<{ token: string }>();
  const [responded, setResponded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRsvp(response: 'confirmed' | 'declined'): void {
    startTransition(async () => {
      try {
        const result = await rsvpByToken({ token, response });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        setResponded(true);
        toast.success(response === 'confirmed' ? 'See you there!' : 'Thanks for letting us know.');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to RSVP');
      }
    });
  }

  if (responded) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-lg font-semibold">Thank you!</h2>
            <p className="text-muted-foreground mt-2 text-sm">Your response has been recorded.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">You&apos;re Invited</CardTitle>
          <p className="text-muted-foreground text-sm">
            A member of Corporate Connections has invited you to an upcoming meeting.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={() => handleRsvp('confirmed')} disabled={isPending} className="w-full">
            {isPending ? 'Responding...' : 'Accept Invitation'}
          </Button>
          <Button
            onClick={() => handleRsvp('declined')}
            disabled={isPending}
            variant="outline"
            className="w-full"
          >
            Decline
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
