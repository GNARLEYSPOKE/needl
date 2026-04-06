import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getMyReferrals } from '@/lib/actions/referral';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  passed: 'default',
  closed: 'secondary',
  lost: 'outline',
};

export default async function ReferralsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { data: referrals, error } = await getMyReferrals();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Referrals</h1>
          <p className="text-muted-foreground mt-1 text-sm">Your referral history.</p>
        </div>
        <Link href="/referrals/new" className={buttonVariants({ variant: 'default' })}>
          Log Referral
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {error && <p className="text-destructive text-sm">{error}</p>}

        {referrals && referrals.length === 0 && (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No referrals logged yet.
          </p>
        )}

        {referrals?.map((r) => (
          <Card key={r.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{r.referred_contact_name}</p>
                  <p className="text-muted-foreground text-xs">
                    Referred to {r.receiving_member_name}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[r.status] ?? 'outline'}>{r.status}</Badge>
              </div>
              {r.notes && <p className="text-muted-foreground mt-2 text-sm">{r.notes}</p>}
              <p className="text-muted-foreground mt-2 text-xs">
                {new Date(r.created_at).toLocaleDateString()}
                {r.estimated_value &&
                  ` · $${Number(r.estimated_value).toLocaleString()} ${r.currency}`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
