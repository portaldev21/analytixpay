import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[var(--color-card-dark-2)]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
