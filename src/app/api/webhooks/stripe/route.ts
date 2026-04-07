import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/admin';

export async function POST(req: Request): Promise<Response> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Graceful handling in development when Stripe isn't configured
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set — skipping Stripe webhook processing');
    return new Response('OK', { status: 200 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.warn('STRIPE_SECRET_KEY not set');
    return new Response('OK', { status: 200 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const body = await req.text();
  const headerPayload = await headers();
  const signature = headerPayload.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  const supabase = createServiceClient();

  // Extract subscription ID safely from event data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stripe event data varies by type
  const eventData = event.data.object as Record<string, any>;

  switch (event.type) {
    case 'invoice.paid': {
      const subscriptionId = String(eventData.subscription ?? '');
      if (subscriptionId) {
        await supabase
          .from('chapters')
          .update({ billing_status: 'active' })
          .eq('billing_status', subscriptionId);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const subscriptionId = String(eventData.subscription ?? '');
      if (subscriptionId) {
        await supabase
          .from('chapters')
          .update({ billing_status: 'payment_failed' })
          .eq('billing_status', subscriptionId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscriptionId = String(eventData.id ?? '');
      if (subscriptionId) {
        await supabase
          .from('chapters')
          .update({ billing_status: 'suspended', is_active: false })
          .eq('billing_status', subscriptionId);
      }
      break;
    }
  }

  return new Response('OK', { status: 200 });
}
