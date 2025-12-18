"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";

interface HeaderProps {
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
}

// Map paths to page titles
const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/analytics": "Analytics",
  "/invoices": "Faturas",
  "/transactions": "Transacoes",
  "/settings": "Configuracoes",
};

function getPageTitle(pathname: string): string {
  // Check for exact match first
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  // Check for partial matches (e.g., /invoices/123)
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path) && path !== "/dashboard") {
      return title;
    }
  }

  return "Dashboard";
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-10",
        "flex h-16 items-center gap-4 px-4 lg:px-6",
        "bg-[var(--color-card-dark-1)]/80 backdrop-blur-lg",
        "border-b border-[var(--glass-border)]",
      )}
    >
      {/* Page Title - visible on mobile */}
      <div className="flex-1 lg:hidden">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
          {pageTitle}
        </h1>
      </div>

      {/* Spacer for desktop */}
      <div className="hidden lg:block flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <Bell className="size-5" />
          {/* Notification indicator */}
          <span className="absolute top-1.5 right-1.5 size-2 bg-[var(--color-negative)] rounded-full" />
        </Button>

        {/* User Info - hidden on small mobile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {user?.name || "Usuario"}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {user?.email}
            </p>
          </div>

          {/* Avatar with ring */}
          <div className="relative">
            <div
              className={cn(
                "absolute -inset-0.5",
                "bg-gradient-to-r from-[var(--color-primary-start)] to-[var(--color-purple-light)]",
                "rounded-full opacity-75",
              )}
            />
            <div className="relative">
              <UserAvatar
                name={user?.name}
                email={user?.email}
                imageUrl={user?.avatarUrl}
                size="md"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
