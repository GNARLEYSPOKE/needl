'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createAsk } from '@/lib/actions/ask';

export function CreateAskForm() {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<'chapter' | 'network'>('network');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(): void {
    if (body.length < 20) {
      toast.error('Describe what you need in at least 20 characters');
      return;
    }

    startTransition(async () => {
      try {
        const result = await createAsk({ body, visibility });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success('Your ask is now live!');
        router.push('/asks');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to post ask';
        toast.error(message);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">What do you need?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="ask-body">Describe what you need in plain language</Label>
          <Textarea
            id="ask-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="I'm looking for a real estate lawyer in Toronto who specializes in commercial leases..."
            rows={5}
            className="mt-1"
          />
          <p className="text-muted-foreground mt-1 text-xs">{body.length}/500 characters</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Visibility</Label>
            <p className="text-muted-foreground text-xs">
              {visibility === 'network'
                ? 'Visible to the entire network'
                : 'Visible to your chapter only'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">Chapter</span>
            <Switch
              checked={visibility === 'network'}
              onCheckedChange={(checked) => setVisibility(checked ? 'network' : 'chapter')}
            />
            <span className="text-xs">Network</span>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={isPending || body.length < 20} className="w-full">
          {isPending ? 'Posting...' : 'Post Ask'}
        </Button>
      </CardContent>
    </Card>
  );
}
