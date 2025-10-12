import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/db/types'

/**
 * Supabase Client for Server Components and Server Actions
 * Use this in Server Components and Server Actions
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Get current user from Supabase
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Get user's accounts
 */
export async function getUserAccounts() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('account_members')
    .select('account_id, accounts(*)')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching user accounts:', error)
    return []
  }

  return data.map(item => item.accounts).filter(Boolean)
}

/**
 * Check if user has access to account
 */
export async function hasAccessToAccount(accountId: string): Promise<boolean> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('account_members')
    .select('id')
    .eq('account_id', accountId)
    .eq('user_id', user.id)
    .single()

  return !error && !!data
}

/**
 * Check if user is account owner
 */
export async function isAccountOwner(accountId: string): Promise<boolean> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('accounts')
    .select('owner_id')
    .eq('id', accountId)
    .single()

  return !error && data?.owner_id === user.id
}
