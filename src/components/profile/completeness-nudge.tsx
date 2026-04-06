import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

interface CompletenessNudgeProps {
  completeness: number;
}

export function CompletenessNudge({ completeness }: CompletenessNudgeProps) {
  if (completeness >= 70) return null;

  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex-1">
          <p className="text-sm font-medium">Complete your profile</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {completeness}% complete — profiles above 70% get more visibility in search.
          </p>
          <Progress value={completeness} className="mt-2" />
        </div>
        <Link href="/profile/edit" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
          Update
        </Link>
      </CardContent>
    </Card>
  );
}
