import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
