"use client";

import { getCategoryColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md";
  className?: string;
}

export function CategoryBadge({
  category,
  size = "sm",
  className,
}: CategoryBadgeProps) {
  const color = getCategoryColor(category);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-lg border transition-colors",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        className,
      )}
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}30`,
        color: color,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {category}
    </span>
  );
}
