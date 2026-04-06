import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getMyProfile } from '@/lib/actions/profile';
import { ProfileEditForm } from '@/components/profile/profile-edit-form';

export default async function ProfileEditPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { data: profile } = await getMyProfile();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Edit Profile</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Update your profile to help other members find you.
      </p>
      <div className="mt-6">
        <ProfileEditForm
          existingProfile={
            profile
              ? {
                  company_name: profile.company_name,
                  company_url: profile.company_url ?? '',
                  tagline: profile.tagline,
                  what_i_do: profile.what_i_do,
                  who_i_serve: profile.who_i_serve,
                  results_i_deliver: profile.results_i_deliver,
                  clients_served: profile.clients_served,
                  geography_served: profile.geography_served,
                  bio: profile.bio,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
