'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { IKnowSomeoneModal } from '@/components/chapter/i-know-someone-modal';
import type { ChapterAsk } from '@/lib/actions/chapter';

interface ChapterAsksListProps {
  asks: ChapterAsk[];
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function ChapterAsksList({ asks }: ChapterAsksListProps): React.ReactElement {
  const [activeAsk, setActiveAsk] = useState<ChapterAsk | null>(null);

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <>
      <div className="space-y-4">
        {asks.map((ask) => (
          <Card key={ask.id}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={ask.avatar_url ?? undefined} alt={ask.member_name} />
                  <AvatarFallback>{getInitials(ask.member_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{ask.member_name}</p>
                  {ask.company_name && (
                    <p className="text-muted-foreground text-xs">{ask.company_name}</p>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">{timeAgo(ask.created_at)}</p>
              </div>

              <p className="mt-3 text-sm">{ask.body}</p>

              <Button onClick={() => setActiveAsk(ask)} className="mt-3 w-full">
                I Know Someone
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeAsk && (
        <IKnowSomeoneModal
          askId={activeAsk.id}
          askBody={activeAsk.body}
          askerName={activeAsk.member_name}
          open={activeAsk !== null}
          onOpenChange={(open) => {
            if (!open) setActiveAsk(null);
          }}
        />
      )}
    </>
  );
}
