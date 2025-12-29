"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validations";
import type { TApiResponse } from "@/db/types";

/**
 * Login with email and password
 */
export async function login(
  email: string,
  password: string,
): Promise<TApiResponse<{ redirectTo: string }>> {
  console.log("[Login Action] Starting login for:", email);

  try {
    // Validate input
    console.log("[Login Action] Validating input...");
    const validated = loginSchema.parse({ email, password });

    console.log("[Login Action] Creating Supabase client...");
    const supabase = await createClient();

    console.log("[Login Action] Calling signInWithPassword...");
    const { error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (error) {
      console.log("[Login Action] Login error:", error.message);
      return {
        data: null,
        error:
          error.message === "Invalid login credentials"
            ? "Email ou senha incorretos"
            : error.message,
        success: false,
      };
    }

    console.log("[Login Action] Login successful, revalidating path...");
    revalidatePath("/", "layout");

    console.log("[Login Action] Returning success");
    return {
      data: { redirectTo: "/dashboard" },
      error: null,
      success: true,
    };
  } catch (error) {
    console.log("[Login Action] Caught error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Erro ao fazer login",
      success: false,
    };
  }
}

/**
 * Sign up with email and password
 */
export async function signup(
  email: string,
  password: string,
  confirmPassword: string,
  fullName?: string,
): Promise<TApiResponse<{ redirectTo: string }>> {
  try {
    // Validate input
    const validated = signupSchema.parse({
      email,
      password,
      confirmPassword,
      fullName,
    });

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          full_name: validated.fullName || "",
        },
      },
    });

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    if (!data.user) {
      return {
        data: null,
        error: "Erro ao criar usuário",
        success: false,
      };
    }

    // Create default account for new user
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .insert({
        name: "Minha Conta",
        owner_id: data.user.id,
      } as any)
      .select()
      .single();

    if (accountError) {
      console.error("Error creating default account:", accountError);
    } else if (account) {
      // Add user as owner member of the account
      const { error: memberError } = await supabase
        .from("account_members")
        .insert({
          account_id: (account as any).id,
          user_id: data.user.id,
          role: "owner",
        } as any);

      if (memberError) {
        console.error("Error adding member to account:", memberError);
      }
    }

    revalidatePath("/", "layout");

    return {
      data: { redirectTo: "/dashboard" },
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Erro ao criar conta",
      success: false,
    };
  }
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Login with Google OAuth
 */
export async function loginWithGoogle(): Promise<
  TApiResponse<{ url: string }>
> {
  console.log("[Google Login] Starting...");

  try {
    console.log("[Google Login] Creating Supabase client...");
    const supabase = await createClient();

    console.log("[Google Login] Calling signInWithOAuth...");
    console.log("[Google Login] Redirect URL:", `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    console.log("[Google Login] Response:", { data, error });

    if (error) {
      console.log("[Google Login] Error:", error.message);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    console.log("[Google Login] Success, URL:", data.url);
    return {
      data: { url: data.url },
      error: null,
      success: true,
    };
  } catch (error) {
    console.log("[Google Login] Caught error:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao fazer login com Google",
      success: false,
    };
  }
}
