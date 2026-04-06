import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMyProfile } from '@/lib/actions/profile';
import { OnboardingForm } from '@/components/profile/onboarding-form';

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const supabase = await createClient();
  const { data: member } = await supabase
    .from('members')
    .select('full_name, avatar_url, onboarding_completed_at')
    .eq('clerk_user_id', userId)
    .single();

  if (member?.onboarding_completed_at) {
    redirect('/dashboard');
  }

  const { data: existingProfile } = await getMyProfile();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <OnboardingForm
        memberName={member?.full_name ?? ''}
        avatarUrl={member?.avatar_url ?? null}
        existingProfile={
          existingProfile
            ? {
                company_name: existingProfile.company_name,
                company_url: existingProfile.company_url ?? '',
                tagline: existingProfile.tagline,
                what_i_do: existingProfile.what_i_do,
                who_i_serve: existingProfile.who_i_serve,
                results_i_deliver: existingProfile.results_i_deliver,
                clients_served: existingProfile.clients_served,
                geography_served: existingProfile.geography_served,
                bio: existingProfile.bio,
              }
            : null
        }
      />
    </div>
  );
}
