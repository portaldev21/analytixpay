import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  console.log("[Auth Callback] Processing code:", code ? "present" : "missing");

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Auth Callback] Error exchanging code:", error.message);
      return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
    }

    console.log("[Auth Callback] Session created successfully");

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Check if user already has an account
      const { data: existingMember } = await supabase
        .from("account_members")
        .select("account_id")
        .eq("user_id", user.id)
        .single();

      // If no account exists, create one (first-time OAuth login)
      if (!existingMember) {
        console.log("[Auth Callback] Creating default account for new OAuth user");

        const { data: account, error: accountError } = await supabase
          .from("accounts")
          .insert({
            name: "Minha Conta",
            owner_id: user.id,
          })
          .select()
          .single();

        if (accountError) {
          console.error("[Auth Callback] Error creating account:", accountError.message);
        } else if (account) {
          // Add user as owner member
          const { error: memberError } = await supabase
            .from("account_members")
            .insert({
              account_id: account.id,
              user_id: user.id,
              role: "owner",
            });

          if (memberError) {
            console.error("[Auth Callback] Error adding member:", memberError.message);
          } else {
            console.log("[Auth Callback] Account and membership created successfully");
          }
        }
      } else {
        console.log("[Auth Callback] User already has an account");
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/dashboard`);
}
