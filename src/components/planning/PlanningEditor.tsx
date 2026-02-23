"use client";

import { Pencil, Wallet } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  addIncome,
  addScenarioItem,
  removeIncome,
  removeScenarioItem,
  updateIncome,
  updatePlan,
  updateScenarioItem,
} from "@/actions/planning.actions";
import { CardGlass } from "@/components/ui/card-glass";
import { Input } from "@/components/ui/input";
import type {
  TFinancialPlanWithDetails,
  TPlanIncomeSource,
  TPlanScenarioItem,
  TPlanScenarioWithItems,
} from "@/db/types";
import {
  calculateMonthlyResult,
  calculateProjection,
} from "@/lib/planning/calculations";
import { cn, formatCurrency } from "@/lib/utils";
import { ExpenseGroup } from "./ExpenseGroup";
import { IncomeSection } from "./IncomeSection";
import { MonthlyResultCard } from "./MonthlyResultCard";
import { ProjectionChart } from "./ProjectionChart";
import { ProjectionTable } from "./ProjectionTable";
import { RunwayCard } from "./RunwayCard";
import { ScenarioTabs } from "./ScenarioTabs";

interface PlanningEditorProps {
  initialPlan: TFinancialPlanWithDetails;
  accountId: string;
}

export function PlanningEditor({
  initialPlan,
  accountId,
}: PlanningEditorProps) {
  // ---- State ----
  const [plan, setPlan] = useState(initialPlan);
  const [incomes, setIncomes] = useState<TPlanIncomeSource[]>(
    initialPlan.incomes,
  );
  const [scenarios, setScenarios] = useState<TPlanScenarioWithItems[]>(
    initialPlan.scenarios,
  );
  const [activeScenarioType, setActiveScenarioType] = useState<
    "current" | "optimistic" | "pessimistic"
  >("current");

  // Header editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(plan.name);
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceValue, setBalanceValue] = useState(
    String(plan.initial_balance),
  );

  // ---- Derived ----
  const activeScenario = useMemo(
    () => scenarios.find((s) => s.type === activeScenarioType),
    [scenarios, activeScenarioType],
  );

  const activeItems = activeScenario?.items ?? [];

  const fixedItems = useMemo(
    () => activeItems.filter((i) => i.expense_type === "fixed"),
    [activeItems],
  );

  const variableItems = useMemo(
    () => activeItems.filter((i) => i.expense_type === "variable"),
    [activeItems],
  );

  const monthlyResult = useMemo(
    () => calculateMonthlyResult(activeItems, incomes, 0),
    [activeItems, incomes],
  );

  // Projection data for table, chart, and runway
  const projection = useMemo(
    () =>
      calculateProjection(
        plan.initial_balance,
        plan.months,
        incomes,
        scenarios,
      ),
    [plan.initial_balance, plan.months, incomes, scenarios],
  );

  // Runway: use last month's cash and the current scenario's average monthly expenses
  const runwayCash = useMemo(() => {
    if (projection.length === 0) return plan.initial_balance;
    return projection[projection.length - 1].current.cash;
  }, [projection, plan.initial_balance]);

  const runwayExpenses = useMemo(() => {
    if (projection.length === 0) return 0;
    const total = projection.reduce((sum, p) => sum + p.current.expenses, 0);
    return total / projection.length;
  }, [projection]);

  // ---- Header handlers ----
  const handleNameBlur = useCallback(async () => {
    setEditingName(false);
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === plan.name) {
      setNameValue(plan.name);
      return;
    }
    setPlan((prev) => ({ ...prev, name: trimmed }));
    const result = await updatePlan(plan.id, accountId, { name: trimmed });
    if (!result.success) {
      toast.error("Erro ao atualizar nome do plano");
      setPlan((prev) => ({ ...prev, name: plan.name }));
      setNameValue(plan.name);
    }
  }, [nameValue, plan.name, plan.id, accountId]);

  const handleBalanceBlur = useCallback(async () => {
    setEditingBalance(false);
    const parsed = Number.parseFloat(balanceValue.replace(",", "."));
    if (Number.isNaN(parsed) || parsed < 0) {
      setBalanceValue(String(plan.initial_balance));
      return;
    }
    if (parsed === plan.initial_balance) return;
    setPlan((prev) => ({ ...prev, initial_balance: parsed }));
    const result = await updatePlan(plan.id, accountId, {
      initial_balance: parsed,
    });
    if (!result.success) {
      toast.error("Erro ao atualizar saldo inicial");
      setPlan((prev) => ({ ...prev, initial_balance: plan.initial_balance }));
      setBalanceValue(String(plan.initial_balance));
    }
  }, [balanceValue, plan.initial_balance, plan.id, accountId]);

  // ---- Income handlers ----
  const handleAddIncome = useCallback(
    async (income: {
      name: string;
      amount: number;
      frequency: "monthly" | "once";
      month_index?: number | null;
    }) => {
      const result = await addIncome(plan.id, accountId, income);
      if (result.success && result.data) {
        setIncomes((prev) => [...prev, result.data as TPlanIncomeSource]);
        toast.success("Renda adicionada");
      } else {
        toast.error(result.error || "Erro ao adicionar renda");
      }
    },
    [plan.id, accountId],
  );

  const handleUpdateIncome = useCallback(
    async (
      incomeId: string,
      updates: {
        name?: string;
        amount?: number;
        frequency?: "monthly" | "once";
        month_index?: number | null;
      },
    ) => {
      // Optimistic update
      setIncomes((prev) =>
        prev.map((inc) => (inc.id === incomeId ? { ...inc, ...updates } : inc)),
      );
      const result = await updateIncome(incomeId, accountId, updates);
      if (!result.success) {
        toast.error("Erro ao atualizar renda");
        // Revert
        setIncomes((prev) =>
          prev.map((inc) => {
            const original = initialPlan.incomes.find((o) => o.id === inc.id);
            return inc.id === incomeId && original ? original : inc;
          }),
        );
      }
    },
    [accountId, initialPlan.incomes],
  );

  const handleRemoveIncome = useCallback(
    async (incomeId: string) => {
      const previous = incomes;
      setIncomes((prev) => prev.filter((inc) => inc.id !== incomeId));
      const result = await removeIncome(incomeId, accountId);
      if (!result.success) {
        toast.error("Erro ao remover renda");
        setIncomes(previous);
      }
    },
    [incomes, accountId],
  );

  // ---- Scenario item handlers ----
  const updateScenarioState = useCallback(
    (
      scenarioId: string,
      updater: (items: TPlanScenarioItem[]) => TPlanScenarioItem[],
    ) => {
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenarioId ? { ...s, items: updater(s.items) } : s,
        ),
      );
    },
    [],
  );

  const handleAddExpense = useCallback(
    async (item: {
      category: string;
      expense_type: "fixed" | "variable";
      name: string;
      amount: number;
      end_month?: number | null;
    }) => {
      if (!activeScenario) return;
      const result = await addScenarioItem(activeScenario.id, accountId, item);
      if (result.success && result.data) {
        updateScenarioState(activeScenario.id, (items) => [
          ...items,
          result.data as TPlanScenarioItem,
        ]);
        toast.success("Despesa adicionada");
      } else {
        toast.error(result.error || "Erro ao adicionar despesa");
      }
    },
    [activeScenario, accountId, updateScenarioState],
  );

  const handleUpdateExpense = useCallback(
    async (
      itemId: string,
      updates: {
        category?: string;
        expense_type?: "fixed" | "variable";
        name?: string;
        amount?: number;
        end_month?: number | null;
      },
    ) => {
      if (!activeScenario) return;
      // Optimistic update
      updateScenarioState(activeScenario.id, (items) =>
        items.map((it) => (it.id === itemId ? { ...it, ...updates } : it)),
      );
      const result = await updateScenarioItem(itemId, accountId, updates);
      if (!result.success) {
        toast.error("Erro ao atualizar despesa");
      }
    },
    [activeScenario, accountId, updateScenarioState],
  );

  const handleRemoveExpense = useCallback(
    async (itemId: string) => {
      if (!activeScenario) return;
      const prevItems = activeScenario.items;
      updateScenarioState(activeScenario.id, (items) =>
        items.filter((it) => it.id !== itemId),
      );
      const result = await removeScenarioItem(itemId, accountId);
      if (!result.success) {
        toast.error("Erro ao remover despesa");
        updateScenarioState(activeScenario.id, () => prevItems);
      }
    },
    [activeScenario, accountId, updateScenarioState],
  );

  // ---- Format helpers ----
  const formatStartMonth = (startMonth: string): string => {
    const months = [
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
    const [yearStr, monthStr] = startMonth.split("-");
    const monthIndex = Number.parseInt(monthStr, 10) - 1;
    return `${months[monthIndex] || monthStr} ${yearStr}`;
  };

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <CardGlass variant="default" size="lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="rounded-xl p-2.5 flex-shrink-0 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20">
              <Wallet className="size-5 text-[var(--color-primary)]" />
            </div>
            <div className="min-w-0 flex-1">
              {editingName ? (
                <Input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleNameBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNameBlur();
                    if (e.key === "Escape") {
                      setNameValue(plan.name);
                      setEditingName(false);
                    }
                  }}
                  className="text-xl font-bold h-9"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="flex items-center gap-2 group"
                >
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)] truncate">
                    {plan.name}
                  </h2>
                  <Pencil className="size-4 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                {formatStartMonth(plan.start_month)} &middot; {plan.months}{" "}
                meses
              </p>
            </div>
          </div>

          {/* Initial balance */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-muted)]">
              Saldo inicial:
            </span>
            {editingBalance ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">
                  R$
                </span>
                <Input
                  autoFocus
                  value={balanceValue}
                  onChange={(e) => setBalanceValue(e.target.value)}
                  onBlur={handleBalanceBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleBalanceBlur();
                    if (e.key === "Escape") {
                      setBalanceValue(String(plan.initial_balance));
                      setEditingBalance(false);
                    }
                  }}
                  className="pl-9 w-36 h-9 tabular-nums"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingBalance(true)}
                className={cn(
                  "flex items-center gap-1.5 group",
                  "text-lg font-bold tabular-nums text-[var(--color-text-primary)]",
                )}
              >
                {formatCurrency(plan.initial_balance)}
                <Pencil className="size-3.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        </div>
      </CardGlass>

      {/* Income Section */}
      <IncomeSection
        incomes={incomes}
        onAdd={handleAddIncome}
        onUpdate={handleUpdateIncome}
        onRemove={handleRemoveIncome}
      />

      {/* Scenario Tabs */}
      <ScenarioTabs
        activeType={activeScenarioType}
        onChangeType={setActiveScenarioType}
      />

      {/* Expense Groups */}
      <div className="space-y-4">
        <ExpenseGroup
          title="Despesas Fixas"
          expenseType="fixed"
          items={fixedItems}
          onAdd={(item) => handleAddExpense({ ...item, expense_type: "fixed" })}
          onUpdate={handleUpdateExpense}
          onRemove={handleRemoveExpense}
        />

        <ExpenseGroup
          title="Despesas Variaveis"
          expenseType="variable"
          items={variableItems}
          onAdd={(item) =>
            handleAddExpense({ ...item, expense_type: "variable" })
          }
          onUpdate={handleUpdateExpense}
          onRemove={handleRemoveExpense}
        />
      </div>

      {/* Monthly Result Card */}
      <MonthlyResultCard result={monthlyResult} />

      {/* Projection Section */}
      <RunwayCard currentCash={runwayCash} monthlyExpenses={runwayExpenses} />

      <ProjectionChart projection={projection} startMonth={plan.start_month} />

      <ProjectionTable projection={projection} startMonth={plan.start_month} />
    </div>
  );
}
