import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileCardProps {
  profile: {
    company_name: string;
    tagline: string;
    what_i_do: string;
    who_i_serve: string;
    geography_served: string[];
    bio?: string;
    results_i_deliver?: string;
    clients_served?: string[];
    company_url?: string | null;
  };
  member?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  isSummary: boolean;
}

export function ProfileCard({ profile, member, isSummary }: ProfileCardProps) {
  const initials = member?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          {member && (
            <Avatar className="h-14 w-14">
              <AvatarImage src={member.avatar_url ?? undefined} alt={member.full_name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          )}
          <div>
            {member && <h2 className="text-lg font-medium">{member.full_name}</h2>}
            <p className="font-medium">{profile.company_name}</p>
            <p className="text-muted-foreground text-sm">{profile.tagline}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">What I Do</h3>
          <p className="text-muted-foreground text-sm">{profile.what_i_do}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium">Who I Serve</h3>
          <p className="text-muted-foreground text-sm">{profile.who_i_serve}</p>
        </div>

        {!isSummary && profile.results_i_deliver && (
          <div>
            <h3 className="text-sm font-medium">Results I Deliver</h3>
            <p className="text-muted-foreground text-sm">{profile.results_i_deliver}</p>
          </div>
        )}

        {!isSummary && profile.bio && (
          <div>
            <h3 className="text-sm font-medium">About</h3>
            <p className="text-muted-foreground text-sm whitespace-pre-line">{profile.bio}</p>
          </div>
        )}

        {!isSummary && profile.clients_served && profile.clients_served.length > 0 && (
          <div>
            <h3 className="text-sm font-medium">Clients & Industries</h3>
            <div className="mt-1 flex flex-wrap gap-1">
              {profile.clients_served.map((client) => (
                <Badge key={client} variant="secondary" className="text-xs">
                  {client}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium">Geography Served</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {profile.geography_served.map((geo) => (
              <Badge key={geo} variant="outline" className="text-xs">
                {geo}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
