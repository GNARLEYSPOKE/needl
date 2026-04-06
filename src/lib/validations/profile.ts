import { z } from 'zod';

export const ProfileBasicsSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  company_url: z.string().optional(),
  tagline: z.string().min(10, 'Tagline must be at least 10 characters'),
  what_i_do: z.string().min(20, 'Describe what you do in at least 20 characters'),
});

export const ProfileAudienceSchema = z.object({
  who_i_serve: z.string().min(20, 'Describe who you serve in at least 20 characters'),
  results_i_deliver: z.string().min(20, 'Describe results in at least 20 characters'),
});

export const ProfileClientsSchema = z.object({
  clients_served: z.array(z.string()).min(1, 'Add at least one client or industry'),
});

export const ProfileGeographySchema = z.object({
  geography_served: z.array(z.string()).min(1, 'Select at least one region'),
});

export const ProfilePhotoSchema = z.object({
  avatar_url: z.string().url().optional(),
});

export const ProfileBioSchema = z.object({
  bio: z.string().min(50, 'Bio must be at least 50 characters'),
});

export const FullProfileSchema = ProfileBasicsSchema.merge(ProfileAudienceSchema)
  .merge(ProfileClientsSchema)
  .merge(ProfileGeographySchema)
  .merge(ProfileBioSchema)
  .merge(ProfilePhotoSchema);

export type ProfileBasicsInput = z.infer<typeof ProfileBasicsSchema>;
export type ProfileAudienceInput = z.infer<typeof ProfileAudienceSchema>;
export type ProfileClientsInput = z.infer<typeof ProfileClientsSchema>;
export type ProfileGeographyInput = z.infer<typeof ProfileGeographySchema>;
export type ProfilePhotoInput = z.infer<typeof ProfilePhotoSchema>;
export type ProfileBioInput = z.infer<typeof ProfileBioSchema>;
export type FullProfileInput = z.infer<typeof FullProfileSchema>;
