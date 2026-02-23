"use client";

import { cn } from "@/lib/utils";

type ScenarioType = "current" | "optimistic" | "pessimistic";

interface ScenarioTabsProps {
  activeType: ScenarioType;
  onChangeType: (type: ScenarioType) => void;
}

const tabs: { type: ScenarioType; label: string }[] = [
  { type: "current", label: "Atual" },
  { type: "optimistic", label: "Otimista" },
  { type: "pessimistic", label: "Pessimista" },
];

export function ScenarioTabs({ activeType, onChangeType }: ScenarioTabsProps) {
  return (
    <div className="flex rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-muted)] p-1 gap-1">
      {tabs.map((tab) => {
        const isActive = tab.type === activeType;
        return (
          <button
            key={tab.type}
            type="button"
            onClick={() => onChangeType(tab.type)}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
