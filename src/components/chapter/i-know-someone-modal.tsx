'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
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
import { cn } from '@/lib/utils';
import { searchByName } from '@/lib/actions/search';
import type { PersonResult } from '@/lib/actions/search';
import { referNeedlMemberForAsk, referExternalForAsk } from '@/lib/actions/referral';

interface IKnowSomeoneModalProps {
  askId: string;
  askBody: string;
  askerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tab = 'member' | 'external';

export function IKnowSomeoneModal({
  askId,
  askBody,
  askerName,
  open,
  onOpenChange,
}: IKnowSomeoneModalProps): React.ReactElement {
  const [tab, setTab] = useState<Tab>('member');

  // Tab 1: member typeahead
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PersonResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PersonResult | null>(null);
  const [memberNote, setMemberNote] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tab 2: external
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [externalNote, setExternalNote] = useState('');

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (selected) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      debounceRef.current = setTimeout(() => setResults([]), 0);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const { data } = await searchByName(query);
      setResults(data ?? []);
      setSearching(false);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  function resetAndClose(): void {
    setQuery('');
    setResults([]);
    setSelected(null);
    setMemberNote('');
    setContactName('');
    setContactEmail('');
    setExternalNote('');
    setTab('member');
    onOpenChange(false);
  }

  function handleSubmitMember(): void {
    if (!selected) return;
    startTransition(async () => {
      const { error } = await referNeedlMemberForAsk({
        askId,
        selectedMemberId: selected.member_id,
        note: memberNote,
      });
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(`Referred ${selected.full_name} to ${askerName}'s ask`);
      resetAndClose();
    });
  }

  function handleSubmitExternal(): void {
    startTransition(async () => {
      const { error } = await referExternalForAsk({
        askId,
        contactName,
        contactEmail,
        note: externalNote,
      });
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(`Referral sent to ${contactEmail}`);
      resetAndClose();
    });
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : resetAndClose())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>I know someone</DialogTitle>
          <DialogDescription>
            Help {askerName} with: <span className="italic">{askBody}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 border-b">
          <button
            type="button"
            onClick={() => setTab('member')}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === 'member'
                ? 'border-foreground text-foreground'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}
          >
            Refer a Needl Member
          </button>
          <button
            type="button"
            onClick={() => setTab('external')}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === 'external'
                ? 'border-foreground text-foreground'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}
          >
            Refer Someone Outside Needl
          </button>
        </div>

        {tab === 'member' && (
          <div className="space-y-3">
            {selected ? (
              <div className="bg-muted/30 flex items-center gap-3 rounded-md p-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selected.avatar_url ?? undefined} alt={selected.full_name} />
                  <AvatarFallback>{getInitials(selected.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{selected.full_name}</p>
                  <p className="text-muted-foreground truncate text-xs">{selected.company_name}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                  Change
                </Button>
              </div>
            ) : (
              <div>
                <Label htmlFor="member-search">Search by name or company</Label>
                <Input
                  id="member-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Start typing a name..."
                  autoFocus
                />
                {searching && <p className="text-muted-foreground mt-2 text-xs">Searching...</p>}
                {!searching && query.length >= 2 && results.length === 0 && (
                  <p className="text-muted-foreground mt-2 text-xs">No matches</p>
                )}
                {results.length > 0 && (
                  <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-md border p-1">
                    {results.map((r) => (
                      <li key={r.member_id}>
                        <button
                          type="button"
                          onClick={() => setSelected(r)}
                          className="hover:bg-muted flex w-full items-center gap-2 rounded-md p-2 text-left"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={r.avatar_url ?? undefined} alt={r.full_name} />
                            <AvatarFallback className="text-xs">
                              {getInitials(r.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{r.full_name}</p>
                            <p className="text-muted-foreground truncate text-xs">
                              {r.company_name}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div>
              <Label htmlFor="member-note">Note (optional)</Label>
              <Textarea
                id="member-note"
                value={memberNote}
                onChange={(e) => setMemberNote(e.target.value)}
                rows={3}
                placeholder="Why are they a good fit?"
              />
            </div>
          </div>
        )}

        {tab === 'external' && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <Label htmlFor="external-note">Note (optional)</Label>
              <Textarea
                id="external-note"
                value={externalNote}
                onChange={(e) => setExternalNote(e.target.value)}
                rows={3}
                placeholder="Why are they a good fit?"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose} disabled={isPending}>
            Cancel
          </Button>
          {tab === 'member' ? (
            <Button onClick={handleSubmitMember} disabled={isPending || !selected}>
              {isPending ? 'Sending...' : 'Send referral'}
            </Button>
          ) : (
            <Button
              onClick={handleSubmitExternal}
              disabled={isPending || !contactName || !contactEmail}
            >
              {isPending ? 'Sending...' : 'Send referral'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
