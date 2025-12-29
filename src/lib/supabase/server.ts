import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/db/types";
import { env } from "@/lib/env";

/**
 * Supabase Client for Server Components and Server Actions
 * Use this in Server Components and Server Actions
 */
export async function createClient() {
  console.log("[Supabase Server] Creating client...");
  console.log("[Supabase Server] URL:", env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...");

  const cookieStore = await cookies();

  const client = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );

  console.log("[Supabase Server] Client created successfully");
  return client;
}

/**
 * Get current user from Supabase
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get user's accounts
 */
export async function getUserAccounts() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("account_members")
    .select("account_id, accounts(*)")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching user accounts:", error);
    return [];
  }

  return data.map((item) => (item as any).accounts).filter(Boolean);
}

/**
 * Check if user has access to account
 */
export async function hasAccessToAccount(accountId: string): Promise<boolean> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("account_members")
    .select("id")
    .eq("account_id", accountId)
    .eq("user_id", user.id)
    .single();

  return !error && !!data;
}

/**
 * Check if user is account owner
 */
export async function isAccountOwner(accountId: string): Promise<boolean> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("owner_id")
    .eq("id", accountId)
    .single();

  return !error && (data as any)?.owner_id === user.id;
}

/**
 * Require user to be authenticated (throws if not)
 * @returns Authenticated user and supabase client
 * @throws Error if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const supabase = await createClient();
  return { user, supabase };
}

/**
 * Require user to have access to account (throws if not)
 * @returns User and supabase client
 * @throws Error if not authenticated or no access
 */
export async function requireAccountAccess(accountId: string) {
  const { user, supabase } = await requireAuth();

  const hasAccess = await hasAccessToAccount(accountId);
  if (!hasAccess) {
    throw new Error("Acesso negado a esta conta");
  }

  return { user, supabase, accountId };
}

/**
 * Require user to be account owner (throws if not)
 * @returns User, account, and supabase client
 * @throws Error if not authenticated or not owner
 */
export async function requireAccountOwnership(accountId: string) {
  const { user, supabase } = await requireAuth();

  const { data: account, error } = await supabase
    .from("accounts")
    .select("owner_id")
    .eq("id", accountId)
    .single();

  if (error || !account) {
    throw new Error("Conta não encontrada");
  }

  if ((account as any).owner_id !== user.id) {
    throw new Error("Apenas o dono da conta pode realizar esta ação");
  }

  return { user, account, supabase, accountId };
}
