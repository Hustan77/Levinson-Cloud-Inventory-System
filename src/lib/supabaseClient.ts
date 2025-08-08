"use client";

import { createClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client (safe reads only).
 * Uses the public anon key; still governed by RLS.
 */
export function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  if (!url || !anon) {
    throw new Error("Supabase client env vars missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient(url, anon, {
    auth: { persistSession: false },
    global: { headers: { "X-Client-Info": "sol-levinson-inventory-client" } }
  });
}
