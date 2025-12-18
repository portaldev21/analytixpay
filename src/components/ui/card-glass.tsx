"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const cardGlassVariants = cva(
  "relative overflow-hidden transition-all duration-200",
  {
    variants: {
      variant: {
        default: [
          "bg-[var(--glass-bg)]",
          "backdrop-blur-[var(--glass-blur)]",
          "border border-[var(--glass-border)]",
          "shadow-[var(--shadow-card)]",
        ],
        "dark-1": [
          "bg-[var(--color-card-dark-1)]",
          "border border-[var(--glass-border)]",
          "shadow-[var(--shadow-card)]",
        ],
        "dark-2": [
          "bg-[var(--color-card-dark-2)]",
          "border border-[var(--glass-border)]",
          "shadow-[var(--shadow-card)]",
        ],
        "dark-3": [
          "bg-[var(--color-card-dark-3)]",
          "border border-[var(--glass-border)]",
          "shadow-[var(--shadow-card)]",
        ],
        blue: [
          "bg-gradient-to-br from-[var(--color-card-blue-start)] to-[var(--color-card-blue-end)]",
          "border border-[var(--glass-border)]",
          "shadow-[var(--shadow-card)]",
        ],
        primary: [
          "bg-gradient-to-br from-[var(--color-primary-start)] to-[var(--color-primary-end)]",
          "border border-[var(--glass-border)]",
          "shadow-[var(--shadow-card)]",
        ],
        purple: [
          "bg-gradient-to-br from-[var(--color-purple-light)] to-[var(--color-purple-mid)]",
          "border border-[var(--glass-border)]",
          "shadow-[var(--shadow-card)]",
        ],
        subtle: [
          "bg-[rgba(9,24,58,0.5)]",
          "backdrop-blur-[12px]",
          "border border-[rgba(255,255,255,0.05)]",
        ],
      },
      size: {
        sm: "rounded-[var(--radius-sm)] p-3",
        md: "rounded-[var(--radius-md)] p-4",
        lg: "rounded-[var(--radius-lg)] p-5",
        xl: "rounded-[var(--radius-xl)] p-6",
      },
      glow: {
        none: "",
        green: "shadow-[var(--shadow-glow-green)]",
        purple: "shadow-[var(--shadow-glow-purple)]",
      },
      interactive: {
        true: "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "lg",
      glow: "none",
      interactive: false,
    },
  },
);

export interface CardGlassProps
  extends Omit<HTMLMotionProps<"div">, "children">,
    VariantProps<typeof cardGlassVariants> {
  children: React.ReactNode;
  hoverGlow?: "green" | "purple" | "none";
}

const CardGlass = React.forwardRef<HTMLDivElement, CardGlassProps>(
  (
    {
      className,
      variant,
      size,
      glow,
      interactive,
      hoverGlow = "none",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          cardGlassVariants({ variant, size, glow, interactive }),
          className,
        )}
        whileHover={
          interactive
            ? {
                scale: 1.02,
                boxShadow:
                  hoverGlow === "green"
                    ? "0 0 30px rgba(66, 167, 164, 0.3)"
                    : hoverGlow === "purple"
                      ? "0 0 30px rgba(170, 136, 245, 0.3)"
                      : undefined,
              }
            : undefined
        }
        whileTap={interactive ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
CardGlass.displayName = "CardGlass";

// Sub-components for consistent structure
const CardGlassHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
));
CardGlassHeader.displayName = "CardGlassHeader";

const CardGlassTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold text-[var(--color-text-primary)] leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
CardGlassTitle.displayName = "CardGlassTitle";

const CardGlassDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--color-text-muted)]", className)}
    {...props}
  />
));
CardGlassDescription.displayName = "CardGlassDescription";

const CardGlassContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardGlassContent.displayName = "CardGlassContent";

const CardGlassFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
CardGlassFooter.displayName = "CardGlassFooter";

// Value display component for KPIs
interface CardGlassValueProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number;
  label?: string;
  trend?: {
    value: number;
    positive?: boolean;
  };
}

const CardGlassValue = React.forwardRef<HTMLDivElement, CardGlassValueProps>(
  ({ className, value, label, trend, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-1", className)} {...props}>
      {label && (
        <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
      )}
      <p className="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums">
        {value}
      </p>
      {trend && (
        <p
          className={cn(
            "text-sm font-medium",
            trend.positive !== false
              ? "text-[var(--color-positive)]"
              : "text-[var(--color-negative)]",
          )}
        >
          {trend.positive !== false ? "+" : ""}
          {trend.value.toFixed(1)}%
        </p>
      )}
    </div>
  ),
);
CardGlassValue.displayName = "CardGlassValue";

export {
  CardGlass,
  CardGlassHeader,
  CardGlassTitle,
  CardGlassDescription,
  CardGlassContent,
  CardGlassFooter,
  CardGlassValue,
  cardGlassVariants,
};
