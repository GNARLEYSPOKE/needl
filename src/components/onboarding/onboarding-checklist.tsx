import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OnboardingStep } from '@/lib/actions/onboarding';

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
}

export function OnboardingChecklist({ steps }: OnboardingChecklistProps) {
  const completedCount = steps.filter((s) => s.completed).length;

  if (completedCount === steps.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Get started with Needl</CardTitle>
        <p className="text-muted-foreground text-sm">
          {completedCount} of {steps.length} steps complete
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                  step.completed
                    ? 'bg-primary text-primary-foreground'
                    : 'border-muted-foreground/30 text-muted-foreground border'
                }`}
              >
                {step.completed ? '✓' : ''}
              </span>
              {step.completed ? (
                <span className="text-muted-foreground text-sm line-through">{step.label}</span>
              ) : (
                <Link href={step.href} className="text-sm hover:underline">
                  {step.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
