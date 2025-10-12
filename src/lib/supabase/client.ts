import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/db/types'

/**
 * Supabase Client for Client Components
 * Use this in 'use client' components
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
