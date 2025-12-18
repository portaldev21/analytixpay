"use client";

import { CardGlass } from "@/components/ui/card-glass";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for stats cards
 */
export function StatsCardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <CardGlass key={i} variant="dark-1" size="lg">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-32" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--glass-border)]">
            <Skeleton className="h-4 w-full" />
          </div>
        </CardGlass>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for chart components
 */
export function ChartSkeleton() {
  return (
    <CardGlass variant="dark-1" size="lg">
      <div className="mb-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-[300px] w-full rounded-xl" />
    </CardGlass>
  );
}

/**
 * Skeleton loader for list items
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <CardGlass variant="dark-1" size="lg">
      <div className="mb-4">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: items }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-card-dark-2)]/50"
          >
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </CardGlass>
  );
}

/**
 * Skeleton loader for complete dashboard
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>

      {/* Stats cards */}
      <StatsCardSkeleton />

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        <ChartSkeleton />
        <ListSkeleton />
        <div className="lg:col-span-2">
          <ListSkeleton />
        </div>
      </div>
    </div>
  );
}
