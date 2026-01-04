import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;

  // Redirect OAuth code to callback route (cookies need proper handling)
  if (params.code) {
    console.log("[Home] OAuth code detected, redirecting to callback route...");
    redirect(`/auth/callback?code=${params.code}`);
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
