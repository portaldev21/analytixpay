import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { MobileNavbar } from "@/components/dashboard/MobileNavbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-main-gradient">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Header */}
        <Header
          user={{
            name: user.user_metadata?.name || user.email?.split("@")[0],
            email: user.email,
            avatarUrl: user.user_metadata?.avatar_url,
          }}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto p-4 lg:p-6 pb-24 lg:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavbar />
    </div>
  );
}
