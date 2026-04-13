'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReferMemberModal } from '@/components/chapter/refer-member-modal';
import type { DirectoryMember } from '@/app/(app)/chapter/members/page';

interface MemberDirectoryProps {
  members: DirectoryMember[];
  senderName: string;
}

export function MemberDirectory({ members, senderName }: MemberDirectoryProps): React.ReactElement {
  const [selectedMember, setSelectedMember] = useState<DirectoryMember | null>(null);

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function getFirstName(name: string): string {
    return name.split(' ')[0];
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
              <Avatar className="h-14 w-14">
                <AvatarImage src={member.avatar_url ?? undefined} alt={member.full_name} />
                <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
              </Avatar>
              <div className="w-full">
                <p className="truncate text-sm font-medium">{member.full_name}</p>
                {member.has_profile ? (
                  <p className="text-muted-foreground truncate text-xs">{member.company_name}</p>
                ) : (
                  <Badge variant="outline" className="mt-1 text-xs">
                    Profile incomplete
                  </Badge>
                )}
              </div>
              {member.has_profile && (
                <>
                  <p className="text-muted-foreground line-clamp-2 text-xs">{member.tagline}</p>
                  <p className="text-muted-foreground line-clamp-1 text-xs italic">
                    {member.what_i_do}
                  </p>
                </>
              )}
              <Button
                onClick={() => setSelectedMember(member)}
                variant="outline"
                size="sm"
                disabled={!member.has_profile}
                className="mt-2 w-full"
              >
                Refer {getFirstName(member.full_name)}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedMember && (
        <ReferMemberModal
          member={selectedMember}
          senderName={senderName}
          open={selectedMember !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedMember(null);
          }}
        />
      )}
    </>
  );
}
