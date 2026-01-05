import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full",
        "rounded-[var(--radius-sm)]",
        "border border-[var(--color-border-light)]",
        "bg-[var(--color-surface-muted)]",
        "px-3 py-2 text-sm",
        "text-[var(--color-text-primary)]",
        "placeholder:text-[var(--color-text-muted)]",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:border-[var(--color-primary)]",
        "hover:border-[var(--color-text-muted)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
