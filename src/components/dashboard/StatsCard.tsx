"use client";

import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  CreditCard,
  Calendar,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { CardGlass } from "@/components/ui/card-glass";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  CreditCard,
  Calendar,
  Receipt,
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string | LucideIcon;
  description?: string;
  trend?: {
    value: number | null;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "purple";
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  variant = "default",
  className,
}: StatsCardProps) {
  // Support both string icon names and direct icon components
  const Icon = typeof icon === "string" ? iconMap[icon] || DollarSign : icon;
  const iconBgColor = {
    default: "bg-[var(--color-card-dark-2)]",
    primary:
      "bg-gradient-to-br from-[var(--color-primary-start)]/20 to-[var(--color-primary-end)]/20",
    purple:
      "bg-gradient-to-br from-[var(--color-purple-light)]/20 to-[var(--color-purple-mid)]/20",
  };

  const iconColor = {
    default: "text-[var(--color-text-muted)]",
    primary: "text-[var(--color-primary-start)]",
    purple: "text-[var(--color-purple-light)]",
  };

  return (
    <CardGlass
      variant="dark-1"
      size="lg"
      interactive
      hoverGlow={
        variant === "primary"
          ? "green"
          : variant === "purple"
            ? "purple"
            : "none"
      }
      className={className}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[var(--color-text-muted)]">
            {title}
          </p>
          <motion.p
            className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {value}
          </motion.p>
        </div>

        <div className={cn("p-2.5 rounded-xl", iconBgColor[variant])}>
          <Icon className={cn("size-5", iconColor[variant])} />
        </div>
      </div>

      {description && (
        <p className="text-xs text-[var(--color-text-muted)] mt-3">
          {description}
        </p>
      )}

      {trend && trend.value !== null && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--glass-border)]">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              trend.isPositive
                ? "bg-[var(--color-positive)]/10 text-[var(--color-positive)]"
                : "bg-[var(--color-negative)]/10 text-[var(--color-negative)]",
            )}
          >
            {trend.isPositive ? "+" : "-"}
            {Math.abs(trend.value).toFixed(0)}%
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            vs periodo anterior
          </span>
        </div>
      )}
    </CardGlass>
  );
}
