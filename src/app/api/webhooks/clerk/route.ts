import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { type WebhookEvent } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/admin';

export async function POST(req: Request): Promise<Response> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // Verify Svix signature
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: WebhookEvent;
  try {
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  const supabase = createServiceClient();

  if (event.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url, external_accounts } = event.data;

    // Skip if member already exists for this Clerk user
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('clerk_user_id', id)
      .single();

    if (existing) {
      return new Response('OK', { status: 200 });
    }

    const primaryEmail = email_addresses.find((e) => e.id === event.data.primary_email_address_id);
    const linkedInAccount = external_accounts?.find((a) => a.provider === 'oauth_linkedin_oidc');
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || 'New Member';
    const email = primaryEmail?.email_address ?? `${id}@placeholder.needl.app`;

    // Look up the organization for this deployment (single-tenant)
    const { data: org } = await supabase.from('organizations').select('id').limit(1).single();

    if (!org) {
      console.error('No organization found for member insert');
      return new Response('OK', { status: 200 });
    }

    // Insert member — id is auto-generated uuid, clerk_user_id maps to Clerk
    const { error } = await supabase.from('members').insert({
      organization_id: org.id,
      clerk_user_id: id,
      email,
      full_name: fullName,
      avatar_url: image_url ?? null,
      linkedin_url: linkedInAccount?.public_metadata?.profile_url
        ? String(linkedInAccount.public_metadata.profile_url)
        : null,
      data_residency: 'CA',
    });

    if (error) {
      console.error('Failed to insert member:', error.message);
    }
  }

  if (event.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = event.data;

    const primaryEmail = email_addresses.find((e) => e.id === event.data.primary_email_address_id);
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || 'New Member';

    const { error } = await supabase
      .from('members')
      .update({
        email: primaryEmail?.email_address ?? undefined,
        full_name: fullName,
        avatar_url: image_url ?? null,
      })
      .eq('clerk_user_id', id);

    if (error) {
      console.error('Failed to update member:', error.message);
    }
  }

  // Return 200 for all events (including unhandled types)
  return new Response('OK', { status: 200 });
}
