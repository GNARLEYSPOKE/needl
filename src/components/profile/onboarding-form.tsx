'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ProfileBasicsSchema,
  ProfileAudienceSchema,
  ProfileClientsSchema,
  ProfileGeographySchema,
  ProfileBioSchema,
} from '@/lib/validations/profile';
import type { FullProfileInput } from '@/lib/validations/profile';
import { completeOnboarding } from '@/lib/actions/profile';

const STEPS = ['Basics', 'Audience', 'Clients', 'Geography', 'Photo', 'Review'] as const;

const GEOGRAPHY_OPTIONS = [
  'Canada',
  'United States',
  'Ontario',
  'British Columbia',
  'Alberta',
  'Quebec',
  'California',
  'New York',
  'Texas',
  'Florida',
  'United Kingdom',
  'Australia',
] as const;

interface OnboardingFormProps {
  memberName: string;
  avatarUrl: string | null;
  existingProfile: Omit<FullProfileInput, 'avatar_url'> | null;
}

export function OnboardingForm({ memberName, avatarUrl, existingProfile }: OnboardingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [clientInput, setClientInput] = useState('');
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const form = useForm<FullProfileInput>({
    defaultValues: {
      company_name: existingProfile?.company_name ?? '',
      company_url: existingProfile?.company_url ?? '',
      tagline: existingProfile?.tagline ?? '',
      what_i_do: existingProfile?.what_i_do ?? '',
      who_i_serve: existingProfile?.who_i_serve ?? '',
      results_i_deliver: existingProfile?.results_i_deliver ?? '',
      clients_served: existingProfile?.clients_served ?? [],
      geography_served: existingProfile?.geography_served ?? [],
      bio: existingProfile?.bio ?? '',
      avatar_url: avatarUrl ?? undefined,
    },
  });

  const { register, watch, setValue } = form;
  const values = watch();
  const progress = ((step + 1) / STEPS.length) * 100;

  function validateCurrentStep(): boolean {
    const schemas = [
      ProfileBasicsSchema,
      ProfileAudienceSchema,
      ProfileClientsSchema,
      ProfileGeographySchema,
      null, // Photo step has no required validation
      ProfileBioSchema,
    ];

    const schema = schemas[step];
    if (!schema) return true;

    const result = schema.safeParse(values);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = String(issue.path[0]);
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      setStepErrors(errors);
      return false;
    }
    setStepErrors({});
    return true;
  }

  function handleNext(): void {
    if (validateCurrentStep()) {
      setStepErrors({});
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  }

  function handleBack(): void {
    setStepErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleAddClient(): void {
    const trimmed = clientInput.trim();
    if (trimmed && !values.clients_served.includes(trimmed)) {
      setValue('clients_served', [...values.clients_served, trimmed]);
      setClientInput('');
    }
  }

  function handleRemoveClient(client: string): void {
    setValue(
      'clients_served',
      values.clients_served.filter((c) => c !== client),
    );
  }

  function toggleGeography(geo: string): void {
    const current = values.geography_served;
    if (current.includes(geo)) {
      setValue(
        'geography_served',
        current.filter((g) => g !== geo),
      );
    } else {
      setValue('geography_served', [...current, geo]);
    }
  }

  function handleSubmit(): void {
    if (!validateCurrentStep()) return;

    startTransition(async () => {
      const result = await completeOnboarding(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Profile published!');
      router.push('/dashboard');
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {step === 0 ? `Welcome${memberName ? `, ${memberName}` : ''}` : STEPS[step]}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Step {step + 1} of {STEPS.length}
        </p>
        <Progress value={progress} className="mt-3" />
      </div>

      {/* Step 1: Basics */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tell us about your business</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input id="company_name" {...register('company_name')} />
              {stepErrors.company_name && (
                <p className="text-destructive mt-1 text-sm">{stepErrors.company_name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="company_url">Website (optional)</Label>
              <Input id="company_url" placeholder="https://" {...register('company_url')} />
              {stepErrors.company_url && (
                <p className="text-destructive mt-1 text-sm">{stepErrors.company_url}</p>
              )}
              {values.company_url &&
                values.company_url.length > 0 &&
                !/^https?:\/\/.+/.test(values.company_url) && (
                  <p className="mt-1 text-sm text-amber-600">
                    URL should start with https:// (e.g. https://dotfusion.com)
                  </p>
                )}
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                placeholder="One sentence that captures what you do"
                {...register('tagline')}
              />
              {stepErrors.tagline && (
                <p className="text-destructive mt-1 text-sm">{stepErrors.tagline}</p>
              )}
            </div>
            <div>
              <Label htmlFor="what_i_do">What I Do</Label>
              <Textarea
                id="what_i_do"
                placeholder="Describe what you do in plain language"
                rows={3}
                {...register('what_i_do')}
              />
              {stepErrors.what_i_do && (
                <p className="text-destructive mt-1 text-sm">{stepErrors.what_i_do}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Audience */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Who you serve and what results you deliver</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="who_i_serve">Who I Serve</Label>
              <Textarea
                id="who_i_serve"
                placeholder="Describe your ideal client"
                rows={3}
                {...register('who_i_serve')}
              />
              {stepErrors.who_i_serve && (
                <p className="text-destructive mt-1 text-sm">{stepErrors.who_i_serve}</p>
              )}
            </div>
            <div>
              <Label htmlFor="results_i_deliver">Results I Deliver</Label>
              <Textarea
                id="results_i_deliver"
                placeholder="What outcomes do your clients get?"
                rows={3}
                {...register('results_i_deliver')}
              />
              {stepErrors.results_i_deliver && (
                <p className="text-destructive mt-1 text-sm">{stepErrors.results_i_deliver}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Clients */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clients and industries you serve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Add clients or industry categories</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  placeholder="e.g. Real Estate, Tech Startups"
                  value={clientInput}
                  onChange={(e) => setClientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddClient();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={handleAddClient}>
                  Add
                </Button>
              </div>
              {stepErrors.clients_served && (
                <p className="text-destructive mt-1 text-sm">{stepErrors.clients_served}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {values.clients_served.map((client) => (
                <Badge
                  key={client}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleRemoveClient(client)}
                >
                  {client} &times;
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Geography */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Where do you serve clients?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {GEOGRAPHY_OPTIONS.map((geo) => (
                <Button
                  key={geo}
                  type="button"
                  variant={values.geography_served.includes(geo) ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => toggleGeography(geo)}
                >
                  {geo}
                </Button>
              ))}
            </div>
            {stepErrors.geography_served && (
              <p className="text-destructive mt-1 text-sm">{stepErrors.geography_served}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Photo */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile photo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {avatarUrl ? (
              <div className="flex items-center gap-4">
                <Image
                  src={avatarUrl}
                  alt="Profile photo"
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover"
                />
                <p className="text-muted-foreground text-sm">
                  Using your photo from sign-in. You can update it later in profile settings.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No photo yet. You can add one later in profile settings.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 6: Review */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review and publish your profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bio">Your Bio</Label>
              <Textarea
                id="bio"
                placeholder="Write 2-3 paragraphs about your professional story"
                rows={6}
                {...register('bio')}
              />
              {stepErrors.bio && <p className="text-destructive mt-1 text-sm">{stepErrors.bio}</p>}
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium">{values.company_name}</h3>
              <p className="text-muted-foreground text-sm">{values.tagline}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {values.geography_served.map((geo) => (
                  <Badge key={geo} variant="outline" className="text-xs">
                    {geo}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={handleBack}>
            Back
          </Button>
        )}
        <div className="flex-1" />
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={handleNext}>
            Continue
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Publishing...' : 'Publish Profile'}
          </Button>
        )}
      </div>
    </div>
  );
}
