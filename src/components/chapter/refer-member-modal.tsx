'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createExternalReferral } from '@/lib/actions/referral';
import type { DirectoryMember } from '@/app/(app)/chapter/members/page';

interface ReferMemberModalProps {
  member: DirectoryMember;
  senderName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function stripFirstPerson(text: string): string {
  return text.replace(/^\s*(i provide |i offer |i help |i )/i, '').trim();
}

export function ReferMemberModal({
  member,
  senderName,
  open,
  onOpenChange,
}: ReferMemberModalProps): React.ReactElement {
  const specialty = stripFirstPerson(member.what_i_do);
  const initialMessage = `Hi,\n\nI wanted to introduce you to ${member.full_name} from ${member.company_name}. They specialize in ${specialty} and I think they could be a great resource for you.\n\nI think you two should connect.\n\nBest,\n${senderName}`;

  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState(initialMessage);
  const [isPending, startTransition] = useTransition();

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function handleSend(): void {
    startTransition(async () => {
      try {
        const result = await createExternalReferral({
          receivingMemberId: member.id,
          recipientEmail,
          message,
        });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success(`Referral sent to ${recipientEmail}`);
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to send referral');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refer {member.full_name}</DialogTitle>
          <DialogDescription>
            Send a personal email introducing {member.full_name.split(' ')[0]} to someone in your
            network.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/30 flex items-center gap-3 rounded-md p-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.avatar_url ?? undefined} alt={member.full_name} />
            <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{member.full_name}</p>
            <p className="text-muted-foreground text-xs">{member.company_name}</p>
            <p className="text-muted-foreground line-clamp-1 text-xs">{member.tagline}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="recipient-email">To</Label>
            <Input
              id="recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              maxLength={500}
            />
            <p className="text-muted-foreground mt-1 text-xs">{message.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isPending || !recipientEmail || message.length < 20}
          >
            {isPending ? 'Sending...' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
