"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Settings,
  BarChart3,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Orcamento", href: "/budget", icon: Wallet },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Faturas", href: "/invoices", icon: FileText },
  { name: "Config", href: "/settings", icon: Settings },
];

export function MobileNavbar() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-[var(--color-card-dark-1)]/95 backdrop-blur-lg",
        "border-t border-[var(--glass-border)]",
        "px-2 pb-safe",
        "lg:hidden", // Hidden on desktop
      )}
    >
      <div className="flex items-center justify-around h-16">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-16 h-full"
            >
              {/* Active indicator - pill background */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className={cn(
                    "absolute inset-x-1 top-1.5 h-10",
                    "bg-gradient-to-r from-[var(--color-primary-start)] to-[var(--color-primary-end)]",
                    "rounded-xl",
                    "shadow-[var(--shadow-glow-green)]",
                  )}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}

              {/* Icon and label */}
              <div
                className={cn(
                  "relative z-10 flex flex-col items-center gap-0.5",
                  "transition-colors duration-200",
                )}
              >
                <Icon
                  className={cn(
                    "size-5",
                    isActive ? "text-white" : "text-[var(--color-text-muted)]",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-white" : "text-[var(--color-text-muted)]",
                  )}
                >
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
