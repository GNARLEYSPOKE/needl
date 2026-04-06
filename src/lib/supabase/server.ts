import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import type { Database } from '@/types/database';

/**
 * Server-side Supabase client with Clerk JWT for RLS.
 * Use in Server Components and Server Actions where the user is authenticated.
 * The JWT includes organization_id, chapter_ids, and role claims for RLS policies.
 */
export async function createClient(): Promise<ReturnType<typeof createServerClient<Database>>> {
  const cookieStore = await cookies();
  const { getToken } = await auth();

  // Get Clerk-issued JWT with Supabase-compatible claims
  const token = await getToken({ template: 'supabase' });

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll is called from Server Components where cookies cannot be set.
            // This can be ignored when middleware refreshes the session.
          }
        },
      },
    },
  );
}
