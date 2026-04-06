import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import type { Database } from '@/types/database';

/**
 * Server-side Supabase client with Clerk JWT for RLS.
 * Use in Server Actions that write data through RLS policies.
 * Calls Clerk getToken() — avoid calling this in layouts/pages to prevent rate limits.
 */
export async function createClient(): Promise<ReturnType<typeof createServerClient<Database>>> {
  const cookieStore = await cookies();
  const { getToken } = await auth();

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
            // Ignored in Server Components where cookies are read-only.
          }
        },
      },
    },
  );
}
