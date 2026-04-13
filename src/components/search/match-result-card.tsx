'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { ReferMemberModal } from '@/components/chapter/refer-member-modal';
import type { MatchResult } from '@/lib/actions/search';

interface MatchResultCardProps {
  result: MatchResult;
  senderName: string;
}

export function MatchResultCard({ result, senderName }: MatchResultCardProps) {
  const [open, setOpen] = useState(false);

  const initials = result.member_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const scorePercent = Math.round(result.match_score * 100);
  const firstName = result.member_name.split(' ')[0];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={result.avatar_url ?? undefined} alt={result.member_name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{result.member_name}</p>
              <p className="text-muted-foreground text-sm">{result.company_name}</p>
              {result.chapter_name && (
                <p className="text-muted-foreground text-xs">{result.chapter_name}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{result.tagline}</p>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Match confidence</span>
              <span className="text-muted-foreground text-xs">{scorePercent}%</span>
            </div>
            <Progress value={scorePercent} />
          </div>

          {result.geography_served.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.geography_served.map((geo) => (
                <Badge key={geo} variant="outline" className="text-xs">
                  {geo}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/introductions/request/${result.member_id}`}
              className={buttonVariants({ variant: 'outline', className: 'flex-1' })}
            >
              Connect
            </Link>
            <Button onClick={() => setOpen(true)} className="flex-1">
              Refer {firstName}
            </Button>
          </div>
        </CardContent>
      </Card>

      {open && (
        <ReferMemberModal
          member={{
            id: result.member_id,
            full_name: result.member_name,
            avatar_url: result.avatar_url,
            company_name: result.company_name,
            tagline: result.tagline,
            what_i_do: result.what_i_do,
            has_profile: true,
          }}
          senderName={senderName}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
