import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { SearchForm } from '@/components/search/search-form';

export default async function SearchPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Find the right person anywhere in your network.
      </p>
      <div className="mt-6">
        <SearchForm />
      </div>
    </div>
  );
}
