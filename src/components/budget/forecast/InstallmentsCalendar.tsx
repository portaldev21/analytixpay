"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { TCalendarEvent } from "@/db/types";

interface InstallmentsCalendarProps {
  events: TCalendarEvent[];
  className?: string;
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);

  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  return days;
}

function getMonthStartPadding(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function InstallmentsCalendar({
  events,
  className,
}: InstallmentsCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedEvent, setSelectedEvent] = useState<TCalendarEvent | null>(
    null,
  );

  // Create a map of date -> events for quick lookup
  const eventsByDate = useMemo(() => {
    const map = new Map<string, TCalendarEvent[]>();
    for (const event of events) {
      const dateKey = event.date;
      const existing = map.get(dateKey) || [];
      existing.push(event);
      map.set(dateKey, existing);
    }
    return map;
  }, [events]);

  const days = getDaysInMonth(currentYear, currentMonth);
  const startPadding = getMonthStartPadding(currentYear, currentMonth);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const isToday = (date: Date): boolean => {
    return formatDateKey(date) === formatDateKey(today);
  };

  if (events.length === 0) {
    return (
      <CardGlass variant="default" size="lg" className={className}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Calendario de Parcelas
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Visualize as parcelas futuras
          </p>
        </div>
        <div className="flex flex-col items-center justify-center h-[200px] text-[var(--color-text-muted)]">
          <CalendarDays className="h-12 w-12 mb-2 opacity-50" />
          <p>Nenhuma parcela ativa</p>
        </div>
      </CardGlass>
    );
  }

  return (
    <CardGlass variant="default" size="lg" className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Calendario de Parcelas
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Visualize as parcelas futuras
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-[var(--color-text-primary)] min-w-[120px] text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-[var(--color-text-muted)] py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for padding */}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="h-10" />
        ))}

        {/* Day cells */}
        {days.map((date) => {
          const dateKey = formatDateKey(date);
          const dayEvents = eventsByDate.get(dateKey) || [];
          const hasEvents = dayEvents.length > 0;
          const totalAmount = dayEvents.reduce((sum, e) => sum + e.amount, 0);
          const isSelected =
            selectedEvent && dayEvents.some((e) => e === selectedEvent);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => {
                if (hasEvents) {
                  setSelectedEvent(
                    isSelected ? null : dayEvents[0],
                  );
                }
              }}
              className={cn(
                "relative h-10 rounded-lg text-sm font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50",
                isToday(date) &&
                  "ring-2 ring-[var(--color-primary)] ring-offset-1 ring-offset-[var(--color-surface)]",
                hasEvents
                  ? cn(
                      "bg-[var(--color-primary)]/20 text-[var(--color-primary)]",
                      "hover:bg-[var(--color-primary)]/30 cursor-pointer",
                      isSelected && "bg-[var(--color-primary)]/40",
                    )
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
              )}
            >
              {date.getDate()}
              {hasEvents && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white">
                  {dayEvents.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected event details */}
      {selectedEvent && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border-light)]">
          <div className="p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border-light)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {selectedEvent.description}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Parcela {selectedEvent.installment}
                </p>
              </div>
              <span className="text-lg font-bold text-[var(--color-primary)] tabular-nums">
                {formatCurrency(selectedEvent.amount)}
              </span>
            </div>
          </div>

          {/* Show all events for selected date */}
          {(() => {
            const dateEvents = eventsByDate.get(selectedEvent.date) || [];
            if (dateEvents.length > 1) {
              return (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Outras parcelas nesta data:
                  </p>
                  {dateEvents
                    .filter((e) => e !== selectedEvent)
                    .map((event, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className="w-full p-2 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border-light)] text-left hover:bg-[var(--color-surface-muted)] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[var(--color-text-muted)] truncate">
                            {event.description.slice(0, 25)}
                            {event.description.length > 25 ? "..." : ""}
                          </span>
                          <span className="text-xs font-medium text-[var(--color-text-primary)] tabular-nums">
                            {formatCurrency(event.amount)}
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-[var(--color-border-light)]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-muted)]">
            Total em {MONTH_NAMES[currentMonth]}
          </span>
          <span className="font-bold text-[var(--color-text-primary)] tabular-nums">
            {formatCurrency(
              Array.from(eventsByDate.entries())
                .filter(([date]) => {
                  const d = new Date(date);
                  return (
                    d.getMonth() === currentMonth && d.getFullYear() === currentYear
                  );
                })
                .flatMap(([_, events]) => events)
                .reduce((sum, e) => sum + e.amount, 0),
            )}
          </span>
        </div>
      </div>
    </CardGlass>
  );
}
