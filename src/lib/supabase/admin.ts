import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Service role Supabase client — bypasses RLS.
 * Use ONLY in:
 * - Webhook handlers (Clerk, Stripe)
 * - Edge Functions
 * NEVER in Server Actions, Server Components, or client code.
 */
export function createServiceClient(): ReturnType<typeof createClient<Database>> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
