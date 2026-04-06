'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FullProfileSchema } from '@/lib/validations/profile';
import type { FullProfileInput } from '@/lib/validations/profile';
import { saveProfile } from '@/lib/actions/profile';

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

interface ProfileEditFormProps {
  existingProfile: Omit<FullProfileInput, 'avatar_url'> | null;
}

export function ProfileEditForm({ existingProfile }: ProfileEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [clientInput, setClientInput] = useState('');

  const form = useForm<FullProfileInput>({
    resolver: zodResolver(FullProfileSchema),
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
    },
  });

  const { register, watch, setValue, formState, handleSubmit } = form;
  const values = watch();

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

  function onSubmit(data: FullProfileInput): void {
    startTransition(async () => {
      const result = await saveProfile(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Profile saved! Completeness: ${result.data?.profile_completeness}%`);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <Input id="company_name" {...register('company_name')} />
            {formState.errors.company_name && (
              <p className="text-destructive mt-1 text-sm">
                {formState.errors.company_name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="company_url">Website (optional)</Label>
            <Input id="company_url" placeholder="https://" {...register('company_url')} />
          </div>
          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" {...register('tagline')} />
            {formState.errors.tagline && (
              <p className="text-destructive mt-1 text-sm">{formState.errors.tagline.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="what_i_do">What I Do</Label>
            <Textarea id="what_i_do" rows={3} {...register('what_i_do')} />
            {formState.errors.what_i_do && (
              <p className="text-destructive mt-1 text-sm">{formState.errors.what_i_do.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="who_i_serve">Who I Serve</Label>
            <Textarea id="who_i_serve" rows={3} {...register('who_i_serve')} />
            {formState.errors.who_i_serve && (
              <p className="text-destructive mt-1 text-sm">
                {formState.errors.who_i_serve.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="results_i_deliver">Results I Deliver</Label>
            <Textarea id="results_i_deliver" rows={3} {...register('results_i_deliver')} />
            {formState.errors.results_i_deliver && (
              <p className="text-destructive mt-1 text-sm">
                {formState.errors.results_i_deliver.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={6} {...register('bio')} />
            {formState.errors.bio && (
              <p className="text-destructive mt-1 text-sm">{formState.errors.bio.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label>Clients & Industries</Label>
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
            {formState.errors.clients_served && (
              <p className="text-destructive mt-1 text-sm">
                {formState.errors.clients_served.message}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label>Geography Served</Label>
            {formState.errors.geography_served && (
              <p className="text-destructive mt-1 text-sm">
                {formState.errors.geography_served.message}
              </p>
            )}
            <div className="mt-2 grid grid-cols-2 gap-2">
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
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  );
}
