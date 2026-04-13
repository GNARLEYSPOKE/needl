import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Needl</h1>
        <p className="text-foreground/60 mt-2 text-sm">AI-powered member network platform</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/sign-in" className={buttonVariants({ variant: 'default' })}>
            Sign in
          </Link>
          <Link href="/sign-up" className={buttonVariants({ variant: 'outline' })}>
            Join
          </Link>
        </div>
      </div>
    </div>
  );
}
