'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReferMemberModal } from '@/components/chapter/refer-member-modal';
import type { PersonResult } from '@/lib/actions/search';

interface MemberSearchCardProps {
  person: PersonResult;
  senderName: string;
}

export function MemberSearchCard({
  person,
  senderName,
}: MemberSearchCardProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  const initials = person.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const firstName = person.full_name.split(' ')[0];

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={person.avatar_url ?? undefined} alt={person.full_name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{person.full_name}</p>
              <p className="text-muted-foreground text-sm">{person.company_name}</p>
              {person.chapter_name && (
                <p className="text-muted-foreground text-xs">{person.chapter_name}</p>
              )}
            </div>
          </div>

          <p className="mt-3 text-sm">{person.tagline}</p>

          {person.geography_served.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {person.geography_served.map((geo) => (
                <Badge key={geo} variant="outline" className="text-xs">
                  {geo}
                </Badge>
              ))}
            </div>
          )}

          <Button onClick={() => setOpen(true)} className="mt-3 w-full">
            Refer {firstName}
          </Button>
        </CardContent>
      </Card>

      {open && (
        <ReferMemberModal
          member={{
            id: person.member_id,
            full_name: person.full_name,
            avatar_url: person.avatar_url,
            company_name: person.company_name,
            tagline: person.tagline,
            what_i_do: person.what_i_do,
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
