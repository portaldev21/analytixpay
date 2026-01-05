import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-md)] border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-background)]",
  {
    variants: {
      variant: {
        // Default - Verde Esmeralda
        default:
          "border-transparent bg-[var(--color-primary)] text-white shadow-sm hover:bg-[var(--color-primary-hover)]",
        // Secondary - Azul Médio
        secondary:
          "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]",
        // Destructive - Vermelho
        destructive:
          "border-transparent bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/20",
        // Outline - Border only
        outline:
          "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
        // Success - Verde Esmeralda light
        success:
          "border-transparent bg-[var(--color-positive)]/10 text-[var(--color-positive)] hover:bg-[var(--color-positive)]/20",
        // Info - Azul Médio light
        info:
          "border-transparent bg-[var(--color-info)]/10 text-[var(--color-info)] hover:bg-[var(--color-info)]/20",
        // Warning - Âmbar
        warning:
          "border-transparent bg-[var(--color-warning)]/10 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/20",
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
