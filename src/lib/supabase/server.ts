import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function createClient() {
  const store = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },

        setAll(list: CookieToSet[]) {
          try {
            list.forEach(({ name, value, options }) => {
              store.set(name, value, options);
            });
          } catch {
            // Server Components cannot always write cookies.
            // Middleware handles session cookie refreshes.
          }
        },
      },
    }
  );
}

/**
 * Service-role client.
 * Server-only: bypasses Row Level Security.
 * Never import this function into client-side code.
 */
export function createAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}