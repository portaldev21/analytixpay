import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-start)] focus:ring-offset-2 focus:ring-offset-[var(--color-card-dark-1)]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-[var(--color-primary-start)] to-[var(--color-primary-end)] text-white shadow-sm hover:shadow-[var(--shadow-glow-green)]",
        secondary:
          "border-[var(--glass-border)] bg-[var(--color-card-dark-2)] text-[var(--color-text-secondary)] hover:bg-[var(--color-card-dark-3)] hover:text-[var(--color-text-primary)]",
        destructive:
          "border-transparent bg-[var(--color-negative)]/20 text-[var(--color-negative)] hover:bg-[var(--color-negative)]/30",
        outline:
          "border-[var(--glass-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
        positive:
          "border-transparent bg-[var(--color-positive)]/20 text-[var(--color-positive)] hover:bg-[var(--color-positive)]/30",
        purple:
          "border-transparent bg-[var(--color-purple-light)]/20 text-[var(--color-purple-light)] hover:bg-[var(--color-purple-light)]/30",
        info:
          "border-transparent bg-[var(--color-primary-start)]/20 text-[var(--color-primary-start)] hover:bg-[var(--color-primary-start)]/30",
        glass:
          "border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-sm text-[var(--color-text-primary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
