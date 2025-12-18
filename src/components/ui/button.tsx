import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-start)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-main-end)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary - Green gradient pill button (main CTA)
        default: [
          "bg-gradient-to-r from-[var(--color-primary-start)] to-[var(--color-primary-end)]",
          "text-white font-semibold",
          "shadow-lg shadow-[var(--color-primary-end)]/20",
          "hover:shadow-[var(--shadow-glow-green)]",
          "hover:brightness-110",
        ],
        // Destructive - Red for dangerous actions
        destructive: [
          "bg-[var(--color-negative)]",
          "text-white font-semibold",
          "shadow-lg shadow-[var(--color-negative)]/20",
          "hover:brightness-110",
        ],
        // Outline - Transparent with border
        outline: [
          "border border-[var(--glass-border)]",
          "bg-transparent",
          "text-[var(--color-text-secondary)]",
          "hover:bg-[var(--color-card-dark-2)]",
          "hover:text-[var(--color-text-primary)]",
          "hover:border-[var(--color-text-muted)]",
        ],
        // Secondary - Dark card background
        secondary: [
          "bg-[var(--color-card-dark-2)]",
          "text-[var(--color-text-secondary)]",
          "border border-[var(--glass-border)]",
          "hover:bg-[var(--color-card-dark-3)]",
          "hover:text-[var(--color-text-primary)]",
        ],
        // Ghost - Minimal, transparent
        ghost: [
          "text-[var(--color-text-secondary)]",
          "hover:bg-[var(--color-card-dark-2)]/50",
          "hover:text-[var(--color-text-primary)]",
        ],
        // Link - Text only with underline
        link: [
          "text-[var(--color-primary-start)]",
          "underline-offset-4",
          "hover:underline",
          "hover:text-[var(--color-primary-start)]/80",
        ],
        // Purple - Accent variant
        purple: [
          "bg-gradient-to-r from-[var(--color-purple-light)] to-[var(--color-purple-mid)]",
          "text-white font-semibold",
          "shadow-lg shadow-[var(--color-purple-mid)]/20",
          "hover:shadow-[var(--shadow-glow-purple)]",
          "hover:brightness-110",
        ],
        // Glass - Glassmorphism style
        glass: [
          "bg-[var(--glass-bg)]",
          "backdrop-blur-[var(--glass-blur)]",
          "border border-[var(--glass-border)]",
          "text-[var(--color-text-primary)]",
          "hover:bg-[var(--glass-bg)]/80",
        ],
      },
      size: {
        default: "h-10 px-5 py-2 text-sm rounded-[var(--radius-sm)]",
        sm: "h-8 px-3 text-xs rounded-[var(--radius-sm)] [&_svg]:size-3.5",
        lg: "h-12 px-6 text-base rounded-[var(--radius-md)] [&_svg]:size-5",
        xl: "h-14 px-8 text-base rounded-[var(--radius-pill)] [&_svg]:size-5",
        icon: "h-10 w-10 rounded-[var(--radius-sm)] [&_svg]:size-5",
        "icon-sm": "h-8 w-8 rounded-[var(--radius-sm)] [&_svg]:size-4",
        "icon-lg": "h-12 w-12 rounded-[var(--radius-md)] [&_svg]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
