import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with the SERVICE ROLE key.
 * This client bypasses Row Level Security (RLS).
 *
 * ⚠️ Only use this on the server side (Server Actions, API routes).
 *    Never expose this client to the browser.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
