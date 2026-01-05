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
        // Default - Clean white/surface card
        default: [
          "bg-[var(--color-surface)]",
          "border border-[var(--color-border-light)]",
          "shadow-[var(--shadow-lg)]",
        ],
        // Muted - Subtle gray background
        muted: [
          "bg-[var(--color-surface-muted)]",
          "border border-[var(--color-border-light)]",
        ],
        // Primary - Verde Esmeralda
        primary: [
          "bg-[var(--color-primary)]",
          "border border-[var(--color-primary-hover)]",
          "shadow-[var(--shadow-md)]",
          "text-white",
        ],
        // Secondary - Azul Médio
        secondary: [
          "bg-[var(--color-secondary)]",
          "border border-[var(--color-secondary-hover)]",
          "shadow-[var(--shadow-md)]",
          "text-white",
        ],
        // Outline - Transparent with border
        outline: [
          "bg-transparent",
          "border border-[var(--color-border)]",
        ],
      },
      size: {
        sm: "rounded-[var(--radius-sm)] p-3",
        md: "rounded-[var(--radius-md)] p-4",
        lg: "rounded-[var(--radius-lg)] p-5",
        xl: "rounded-[var(--radius-xl)] p-6",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-[var(--shadow-lg)] hover:translate-y-[-2px]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "lg",
      interactive: false,
    },
  },
);

export interface CardGlassProps
  extends Omit<HTMLMotionProps<"div">, "children">,
    VariantProps<typeof cardGlassVariants> {
  children: React.ReactNode;
}

const CardGlass = React.forwardRef<HTMLDivElement, CardGlassProps>(
  (
    {
      className,
      variant,
      size,
      interactive,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          cardGlassVariants({ variant, size, interactive }),
          className,
        )}
        whileHover={
          interactive
            ? {
                scale: 1.01,
                y: -2,
              }
            : undefined
        }
        whileTap={interactive ? { scale: 0.99 } : undefined}
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
      "text-lg font-semibold text-[var(--color-text-primary)] leading-none tracking-tight font-title",
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
      <p className="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums font-mono">
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
