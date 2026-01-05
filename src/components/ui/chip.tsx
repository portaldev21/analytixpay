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
        // Default - subtle gray background
        default: [
          "bg-[var(--color-surface-muted)]",
          "text-[var(--color-text-secondary)]",
          "border border-[var(--color-border-light)]",
        ],
        // Active/Selected - Verde Esmeralda
        active: [
          "bg-[var(--color-primary)]",
          "text-white",
          "shadow-sm shadow-[var(--color-primary)]/20",
        ],
        // Positive - Verde Esmeralda light
        positive: [
          "bg-[var(--color-positive)]/10",
          "text-[var(--color-positive)]",
          "border border-[var(--color-positive)]/30",
        ],
        // Negative - Vermelho light
        negative: [
          "bg-[var(--color-negative)]/10",
          "text-[var(--color-negative)]",
          "border border-[var(--color-negative)]/30",
        ],
        // Info - Azul Médio light
        info: [
          "bg-[var(--color-info)]/10",
          "text-[var(--color-info)]",
          "border border-[var(--color-info)]/30",
        ],
        // Outline - Transparent with border
        outline: [
          "bg-transparent",
          "text-[var(--color-text-muted)]",
          "border border-[var(--color-border)]",
        ],
      },
      size: {
        sm: "h-6 px-2 text-xs rounded-[var(--radius-sm)]",
        md: "h-8 px-3 text-sm rounded-[var(--radius-md)]",
        lg: "h-10 px-4 text-sm rounded-[var(--radius-md)]",
      },
      interactive: {
        true: "cursor-pointer hover:brightness-95 active:scale-95",
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
            className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
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
