import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { CreateAskForm } from '@/components/asks/create-ask-form';

export default async function NewAskPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Post a Standing Ask</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Describe what you need. Needl will actively search the network for you.
      </p>
      <div className="mt-6">
        <CreateAskForm />
      </div>
    </div>
  );
}
