import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary - Verde Esmeralda (main CTA)
        default: [
          "bg-[var(--color-primary)]",
          "text-white font-semibold",
          "shadow-md shadow-[var(--color-primary)]/20",
          "hover:bg-[var(--color-primary-hover)]",
        ],
        // Secondary - Azul Médio
        secondary: [
          "bg-[var(--color-secondary)]",
          "text-white font-semibold",
          "shadow-md shadow-[var(--color-secondary)]/20",
          "hover:bg-[var(--color-secondary-hover)]",
        ],
        // Destructive - Vermelho for dangerous actions
        destructive: [
          "bg-[var(--color-destructive)]",
          "text-white font-semibold",
          "shadow-md shadow-[var(--color-destructive)]/20",
          "hover:brightness-110",
        ],
        // Outline - Transparent with border
        outline: [
          "border border-[var(--color-border)]",
          "bg-transparent",
          "text-[var(--color-text-secondary)]",
          "hover:bg-[var(--color-surface-muted)]",
          "hover:text-[var(--color-text-primary)]",
          "hover:border-[var(--color-text-muted)]",
        ],
        // Ghost - Minimal, transparent
        ghost: [
          "text-[var(--color-text-secondary)]",
          "hover:bg-[var(--color-surface-muted)]",
          "hover:text-[var(--color-text-primary)]",
        ],
        // Link - Text only with underline
        link: [
          "text-[var(--color-secondary)]",
          "underline-offset-4",
          "hover:underline",
          "hover:text-[var(--color-primary)]",
        ],
      },
      size: {
        default: "h-10 px-5 py-2 text-sm rounded-[var(--radius-md)]",
        sm: "h-8 px-3 text-xs rounded-[var(--radius-md)] [&_svg]:size-3.5",
        lg: "h-12 px-6 text-base rounded-[var(--radius-md)] [&_svg]:size-5",
        xl: "h-14 px-8 text-base rounded-[var(--radius-lg)] [&_svg]:size-5",
        icon: "h-10 w-10 rounded-[var(--radius-md)] [&_svg]:size-5",
        "icon-sm": "h-8 w-8 rounded-[var(--radius-md)] [&_svg]:size-4",
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
