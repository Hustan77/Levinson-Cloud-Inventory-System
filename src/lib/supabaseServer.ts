"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using SERVICE ROLE key.
 * IMPORTANT: Never expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase server env vars missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  // Service role client for API route handlers (admin-like privileges, still under RLS).
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
    global: { headers: { "X-Client-Info": "sol-levinson-inventory-server" } }
  });
}
