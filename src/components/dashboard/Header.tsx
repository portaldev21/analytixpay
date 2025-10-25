"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";

interface HeaderProps {
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
  onMenuClick?: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <Button variant="ghost" size="icon">
        <Bell className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium">{user?.name || "Usuário"}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <UserAvatar
          name={user?.name}
          email={user?.email}
          imageUrl={user?.avatarUrl}
        />
      </div>
    </header>
  );
}
