import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[var(--radius-md)]",
          "border border-[var(--color-border)]",
          "bg-[var(--color-input)]",
          "px-3 py-2 text-sm",
          "text-[var(--color-text-primary)]",
          "placeholder:text-[var(--color-text-muted)]",
          "transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--color-text-primary)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:border-[var(--color-primary)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "hover:border-[var(--color-text-muted)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
