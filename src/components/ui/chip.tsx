"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex items-center gap-1.5 font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        // Default - subtle dark background
        default: [
          "bg-[var(--color-card-dark-2)]",
          "text-[var(--color-text-secondary)]",
          "border border-[var(--glass-border)]",
        ],
        // Active/Selected - Green gradient
        active: [
          "bg-gradient-to-r from-[var(--color-primary-start)] to-[var(--color-primary-end)]",
          "text-white",
          "shadow-sm shadow-[var(--color-primary-end)]/20",
        ],
        // Positive - Green outline/fill
        positive: [
          "bg-[var(--color-positive)]/10",
          "text-[var(--color-positive)]",
          "border border-[var(--color-positive)]/30",
        ],
        // Negative - Red outline/fill
        negative: [
          "bg-[var(--color-negative)]/10",
          "text-[var(--color-negative)]",
          "border border-[var(--color-negative)]/30",
        ],
        // Purple - For insights/AI
        purple: [
          "bg-[var(--color-purple-light)]/10",
          "text-[var(--color-purple-light)]",
          "border border-[var(--color-purple-light)]/30",
        ],
        // Outline - Transparent with border
        outline: [
          "bg-transparent",
          "text-[var(--color-text-muted)]",
          "border border-[var(--glass-border)]",
        ],
        // Glass - Glassmorphism
        glass: [
          "bg-[var(--glass-bg)]",
          "backdrop-blur-sm",
          "text-[var(--color-text-secondary)]",
          "border border-[var(--glass-border)]",
        ],
      },
      size: {
        sm: "h-6 px-2 text-xs rounded-md",
        md: "h-8 px-3 text-sm rounded-lg",
        lg: "h-10 px-4 text-sm rounded-xl",
      },
      interactive: {
        true: "cursor-pointer hover:brightness-110 active:scale-95",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      interactive: false,
    },
  },
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  onRemove?: () => void;
  icon?: React.ReactNode;
}

const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  (
    {
      className,
      variant,
      size,
      interactive,
      onRemove,
      icon,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <span
        ref={ref}
        className={cn(chipVariants({ variant, size, interactive }), className)}
        {...props}
      >
        {icon && <span className="[&_svg]:size-3.5">{icon}</span>}
        {children}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-0.5 rounded-full p-0.5 hover:bg-white/10 transition-colors"
          >
            <X className="size-3" />
          </button>
        )}
      </span>
    );
  },
);
Chip.displayName = "Chip";

// Animated chip for filter selections
interface AnimatedChipProps extends ChipProps {
  selected?: boolean;
}

const AnimatedChip = React.forwardRef<HTMLSpanElement, AnimatedChipProps>(
  ({ selected, variant = "default", ...props }, ref) => {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        <Chip
          ref={ref}
          variant={selected ? "active" : variant}
          interactive
          {...props}
        />
      </motion.span>
    );
  },
);
AnimatedChip.displayName = "AnimatedChip";

// Chip group for filter collections
interface ChipGroupProps {
  children: React.ReactNode;
  className?: string;
}

const ChipGroup = ({ children, className }: ChipGroupProps) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <AnimatePresence mode="popLayout">{children}</AnimatePresence>
    </div>
  );
};
ChipGroup.displayName = "ChipGroup";

export { Chip, AnimatedChip, ChipGroup, chipVariants };
