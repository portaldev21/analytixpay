# Context Session 10 — Projection Table, Chart, and Runway Card

## What Was Done

Task 10: Created 3 projection components and wired them into the PlanningEditor.

### Files Created (3 total)

1. **`src/components/planning/ProjectionTable.tsx`** — 12-row scenario projection table
   - Props: `projection: MonthProjection[]`, `startMonth: string`
   - 7 columns: Mes | Atual (Resultado / Saldo) | Otimista (Resultado / Saldo) | Pessimista (Resultado / Saldo)
   - Month labels formatted in Portuguese (e.g., "mar. 2026", "abr. 2026")
   - Currency formatting with `formatCurrency()` from `@/lib/utils`
   - Color-coded values: positive in green (--color-positive), negative in red (--color-negative)
   - Horizontally scrollable on mobile (`overflow-x-auto`, `min-w-[640px]`)
   - Scenario type column headers in their respective colors (primary/positive/negative)
   - Empty state with Table icon

2. **`src/components/planning/ProjectionChart.tsx`** — Recharts line chart for cumulative cash
   - Props: `projection: MonthProjection[]`, `startMonth: string`
   - Uses `LineChart` with 3 lines (current, optimistic, pessimistic)
   - X-axis: month labels; Y-axis: cumulative cash formatted as R$
   - Reference line at y=0 (dashed)
   - Custom tooltip showing all 3 scenario values with colored dots
   - Legend with Portuguese labels (Atual, Otimista, Pessimista)
   - Responsive: smaller on mobile via `useMediaQuery` hook
   - Line colors: primary (#1D5A8F), positive (#2C8A4B), negative (#C62828)

3. **`src/components/planning/RunwayCard.tsx`** — Survival runway indicator
   - Props: `currentCash: number`, `monthlyExpenses: number`
   - Uses `calculateRunway()` from calculations module
   - Displays "X meses de sobrevivencia sem renda" (or infinity symbol)
   - Status badge: Saudavel (green, >6 months), Atencao (yellow, 3-6), Critico (red, <3)
   - Progress bar capped at 12 months visual scale
   - Summary line showing current cash and monthly expenses
   - Icon changes by status: ShieldCheck, Shield, ShieldAlert

### Files Modified (1 total)

4. **`src/components/planning/PlanningEditor.tsx`** — Wired in projection components
   - Renamed `_projection` to `projection` (no longer unused)
   - Added `runwayCash` derived state: last month's current cash from projection
   - Added `runwayExpenses` derived state: average monthly expenses from current scenario
   - Replaced placeholder div with: RunwayCard, ProjectionChart, ProjectionTable
   - Imported 3 new components

### Verification

- TypeScript compilation: PASSED (`npx tsc --noEmit`)
- Biome lint/format: PASSED (`npx biome check --write`)
- Commit: `d89cdc4` on `worktree-feat-planning`

### Design Decisions

- Used existing CSS variables throughout: `--color-positive`, `--color-negative`, `--color-warning`, `--color-primary`
- Matched Recharts patterns from `MonthlyProjectionChart.tsx` and `SpendingByCardChart.tsx`
- Custom tooltip matching project style (rounded-xl, surface bg, shadow-lg)
- Runway uses last projected month's current scenario cash (not initial balance)
- Monthly expenses for runway = average across all projected months (handles end_month items)
- Progress bar on RunwayCard capped at 12 months for visual reference

### Dependencies

- Uses `calculateProjection()` and `calculateRunway()` from `src/lib/planning/calculations.ts` (Task 3)
- Uses `MonthProjection` type from calculations module
- Uses `CardGlass` from design system
- Uses `formatCurrency` from `@/lib/utils`
- Uses `useMediaQuery` hook for responsive chart sizing
- Uses Recharts (already installed in project)

### What's Next

- **Task 11**: Final Integration and Polish
