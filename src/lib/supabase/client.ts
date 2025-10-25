import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/db/types";
import { env } from "@/lib/env";

/**
 * Supabase Client for Client Components
 * Use this in 'use client' components
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
