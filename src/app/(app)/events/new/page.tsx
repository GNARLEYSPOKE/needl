import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/admin';
import { CreateEventForm } from '@/components/chapter/create-event-form';

export default async function NewEventPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Get user's chapter
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
        <p className="text-muted-foreground">No active chapter membership.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Create Event</h1>
      <div className="mt-6">
        <CreateEventForm chapterId={membership.chapter_id} />
      </div>
    </div>
  );
}
