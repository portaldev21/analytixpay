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
  variant?: "default" | "primary" | "secondary";
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
    default: "bg-[var(--color-surface-muted)]",
    primary: "bg-[var(--color-primary)]/10",
    secondary: "bg-[var(--color-secondary)]/10",
  };

  const iconColor = {
    default: "text-[var(--color-text-muted)]",
    primary: "text-[var(--color-primary)]",
    secondary: "text-[var(--color-secondary)]",
  };

  return (
    <CardGlass
      variant="default"
      size="lg"
      interactive
      className={className}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[var(--color-text-muted)]">
            {title}
          </p>
          <motion.p
            className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums font-mono"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {value}
          </motion.p>
        </div>

        <div className={cn("p-2.5 rounded-[var(--radius-md)]", iconBgColor[variant])}>
          <Icon className={cn("size-5", iconColor[variant])} />
        </div>
      </div>

      {description && (
        <p className="text-xs text-[var(--color-text-muted)] mt-3">
          {description}
        </p>
      )}

      {trend && trend.value !== null && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-border-light)]">
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
