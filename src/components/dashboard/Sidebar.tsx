"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  BarChart3,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Orcamento", href: "/budget", icon: Wallet },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Faturas", href: "/invoices", icon: FileText },
  { name: "Transacoes", href: "/transactions", icon: CreditCard },
  { name: "Configuracoes", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div
      className={cn(
        "hidden lg:flex flex-col h-full w-[280px]",
        "bg-[var(--color-surface)]",
        "border-r border-[var(--color-border-light)]",
        "shadow-[var(--shadow-sm)]",
      )}
    >
      {/* Logo */}
      <div className="p-6 pb-8">
        <Link href="/dashboard" className="block">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-primary)] font-title">
            ControleFatura
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Gestao de Faturas
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href} className="relative block">
              {/* Active background */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-bg"
                  className={cn(
                    "absolute inset-0",
                    "bg-[var(--color-primary)]/10",
                    "rounded-[var(--radius-md)]",
                    "border-l-2 border-[var(--color-primary)]",
                  )}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}

              <div
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)]",
                  "text-sm font-medium transition-colors",
                  isActive
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]",
                )}
              >
                <Icon
                  className={cn(
                    "size-5",
                    isActive && "text-[var(--color-primary)]",
                  )}
                />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-4 h-px bg-[var(--color-border-light)]" />

      {/* Logout */}
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]"
          onClick={handleLogout}
        >
          <LogOut className="size-5" />
          Sair
        </Button>
      </div>

      {/* Footer */}
      <div className="p-4 pt-0">
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border-light)]">
          <p className="text-xs text-[var(--color-text-muted)]">
            ControleFatura
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)]/60 mt-1">
            v3.0 - Design System
          </p>
        </div>
      </div>
    </div>
  );
}
