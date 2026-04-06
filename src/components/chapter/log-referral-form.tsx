'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logReferral } from '@/lib/actions/referral';

interface LogReferralFormProps {
  chapterMembers: Array<{ id: string; full_name: string }>;
}

export function LogReferralForm({ chapterMembers }: LogReferralFormProps) {
  const router = useRouter();
  const [receivingMemberId, setReceivingMemberId] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(): void {
    startTransition(async () => {
      try {
        const result = await logReferral({
          receivingMemberId,
          referredContactName: contactName,
          referredContactEmail: contactEmail || undefined,
          notes: notes || undefined,
        });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success('Referral logged!');
        router.push('/referrals');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to log referral');
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Log a Referral</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="receiving">Referred to</Label>
          <select
            id="receiving"
            value={receivingMemberId}
            onChange={(e) => setReceivingMemberId(e.target.value)}
            className="border-input bg-background mt-1 block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Select a member...</option>
            {chapterMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="contact-name">Contact Name</Label>
          <Input
            id="contact-name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Who are you referring?"
          />
        </div>
        <div>
          <Label htmlFor="contact-email">Contact Email (optional)</Label>
          <Input
            id="contact-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Context about the referral"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isPending || !receivingMemberId || !contactName}
          className="w-full"
        >
          {isPending ? 'Logging...' : 'Log Referral'}
        </Button>
      </CardContent>
    </Card>
  );
}
