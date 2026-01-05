import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[var(--color-surface-muted)]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
