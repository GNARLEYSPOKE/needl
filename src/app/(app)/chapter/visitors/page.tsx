import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/admin';
import { getVisitorPipeline } from '@/lib/actions/visitor';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'outline'> = {
  pending: 'outline',
  confirmed: 'default',
  declined: 'secondary',
};

const FOLLOWUP_LABELS: Record<string, string> = {
  none: 'No follow-up',
  contacted: 'Contacted',
  applied: 'Applied',
  joined: 'Joined',
};

export default async function VisitorPipelinePage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const adminClient = createServiceClient();
  const { data: member } = await adminClient
    .from('members')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (!member) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <p className="text-muted-foreground">Member not found.</p>
      </div>
    );
  }

  const { data: membership } = await adminClient
    .from('chapter_memberships')
    .select('chapter_id')
    .eq('member_id', member.id)
    .eq('status', 'active')
    .limit(1)
    .single();

  if (!membership) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <p className="text-muted-foreground">No active chapter.</p>
      </div>
    );
  }

  const { data: visitors, error } = await getVisitorPipeline(membership.chapter_id);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Visitor Pipeline</h1>
      <p className="text-muted-foreground mt-1 text-sm">Track invited visitors across events.</p>

      <div className="mt-6 space-y-4">
        {error && <p className="text-destructive text-sm">{error}</p>}

        {visitors && visitors.length === 0 && (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No visitors invited yet.
          </p>
        )}

        {visitors?.map((v) => (
          <Card key={v.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{v.visitor_name}</p>
                  <p className="text-muted-foreground text-xs">{v.visitor_email}</p>
                  {v.visitor_company && (
                    <p className="text-muted-foreground text-xs">{v.visitor_company}</p>
                  )}
                </div>
                <Badge variant={STATUS_COLORS[v.rsvp_status] ?? 'outline'}>{v.rsvp_status}</Badge>
              </div>
              <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
                <span>{v.event_title}</span>
                <span>·</span>
                <span>Invited by {v.inviting_member_name}</span>
                <span>·</span>
                <span>{FOLLOWUP_LABELS[v.follow_up_status] ?? v.follow_up_status}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
