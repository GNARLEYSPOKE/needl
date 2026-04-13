'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requestIntroduction } from '@/lib/actions/introduction';

interface RequestIntroFormProps {
  targetMemberId: string;
  targetName: string;
  targetCompany: string;
  connectorName: string | null;
  askId?: string;
  matchId?: string;
}

export function RequestIntroForm({
  targetMemberId,
  targetName,
  targetCompany,
  connectorName,
  askId,
  matchId,
}: RequestIntroFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(): void {
    if (message.length < 10) {
      toast.error('Write at least 10 characters');
      return;
    }

    startTransition(async () => {
      try {
        const result = await requestIntroduction({
          targetMemberId,
          message,
          askId,
          matchId,
        });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success('Request sent!');
        router.push('/introductions');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to send request';
        toast.error(msg);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Connect to {targetName}</CardTitle>
        <p className="text-muted-foreground text-sm">{targetCompany}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectorName ? (
          <p className="text-sm">
            <strong>{connectorName}</strong> will facilitate this introduction.
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            This will be sent as a direct request to {targetName}.
          </p>
        )}

        <div>
          <Label htmlFor="intro-message">
            Add a note{connectorName ? ` for ${connectorName}` : ''}
          </Label>
          <Textarea
            id="intro-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explain why you'd like to connect..."
            rows={4}
            className="mt-1"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isPending || message.length < 10}
          className="w-full"
        >
          {isPending ? 'Sending...' : 'Send Request'}
        </Button>
      </CardContent>
    </Card>
  );
}
