'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Resolve the current Clerk user to a Needl member UUID.
 * Every Server Action that needs the member ID should call this
 * instead of using auth().userId directly.
 */
export async function getCurrentMemberId(): Promise<{
  data: { memberId: string; clerkUserId: string } | null;
  error: string | null;
}> {
  const { userId } = await auth();
  if (!userId) return { data: null, error: 'Unauthorized' };

  const supabase = await createClient();
  const { data: member, error } = await supabase
    .from('members')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (error || !member) {
    return { data: null, error: 'Member not found' };
  }

  return { data: { memberId: member.id, clerkUserId: userId }, error: null };
}
