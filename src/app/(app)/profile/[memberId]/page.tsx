import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/actions/profile';
import { createServiceClient } from '@/lib/supabase/admin';
import { ProfileCard } from '@/components/profile/profile-card';

interface ProfilePageProps {
  params: Promise<{ memberId: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { memberId } = await params;
  const { data: profile, error } = await getProfile(memberId);

  if (error || !profile) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  const supabase = createServiceClient();
  const { data: member } = await supabase
    .from('members')
    .select('full_name, avatar_url')
    .eq('id', memberId)
    .single();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <ProfileCard profile={profile} member={member} isSummary={profile.is_summary} />
    </div>
  );
}
