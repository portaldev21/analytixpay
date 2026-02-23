---
name: prd-tasks
description: 'Generate task files from an existing PRD. Use when a PRD is approved and ready for implementation, when you need to break a PRD into trackable tasks, or when asked to create tasks from a PRD. Triggers on: create tasks from prd, generate tasks, break down prd, task breakdown.'
user-invocable: true
---

# PRD Task Generator — ControleFatura

Read an existing PRD from `docs/plans/` and generate individual task files in `docs/tasks/XX/`, one per User Story.

---

## The Job

1. **Identify the PRD**: User provides PRD number or file path. If not provided, read `docs/plans/INDEX.md` to list available PRDs.
2. **Read the PRD**: Parse `docs/plans/XX_feature-name.md`
3. **Pre-research**: Verify real schemas, actions, and prior context (see Step 0 below)
4. **Extract User Stories**: Each `US-XXX` becomes one task file
5. **Create task folder**: `docs/tasks/XX/` (matching the PRD number)
6. **Generate task files**: One `.md` per User Story
7. **Update INDEX.md**: Set PRD status to "Em andamento", add detail section with US table

**Important:** Do NOT start implementing. Just create the task files.

---

## Step 0: Pre-Research (Before Generating Tasks)

Before writing any task file, **verify real data** from the codebase:

1. **Check `types.ts`**: Verify real type definitions for tables mentioned in the PRD — types are manually defined with T prefix (e.g., `TTransaction`, `TInvoice`, `TAccount`)
   ```
   Grep for the type/table name in src/db/types.ts
   ```
2. **Check existing Server Actions**: Look for actions that already handle the feature domain — check what functions exist and their signatures
   ```
   Grep for the feature keyword in src/actions/*.actions.ts
   ```
3. **Check existing components**: Verify which components exist vs. need to be created
   ```
   Glob for src/components/{feature}/**/*.tsx
   ```
4. **Check existing pages**: Verify which pages/routes exist
   ```
   Glob for src/app/(dashboard)/{page}/**/page.tsx
   ```
5. **Check `.claude/tasks/`**: Search for related session context files that may have prior investigation on the feature
   ```
   Grep for the feature keyword in .claude/tasks/context_session_*.md
   ```
6. **Check CLAUDE.md**: Read the root `CLAUDE.md` for architecture patterns and conventions

This pre-research prevents writing tasks with wrong field names, missing context, or referencing non-existent code.

---

## Task File Format

Each task file follows this structure:

**Filename:** `docs/tasks/XX/US-NNN_title-kebab-case.md`

```markdown
# US-NNN: Title

> **PRD**: `docs/plans/XX_feature-name.md`
> **Task**: `docs/tasks/XX/US-NNN_title-kebab-case.md`
> **Status**: Pendente

## Description

As a [role], I want [feature] so that [benefit].

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] `npm run lint && npm run build` passes (Biome check + TypeScript compilation)
- [ ] **[If UI]** Verify in browser at localhost:3000
- [ ] **[If Supabase]** Migration created and RLS policies defined
- [ ] **[If permissions]** Auth checks via `requireAuth()` / `requireAccountAccess()` / `requireAccountOwnership()`

## Implementation Notes

### Files to modify/create

- `src/components/...` -- description
- `src/actions/...` -- description
- `src/db/types.ts` -- description
- `src/lib/validations/index.ts` -- description

### Codigo atual (referencia)

Include relevant code snippets from the current codebase so the implementer
knows the exact function signatures, variable names, and patterns to follow.
This avoids the need to read files before starting.

### Key patterns to follow

- Auth via `requireAuth()` / `requireAccountAccess(accountId)` / `requireAccountOwnership(accountId)` from `@/lib/supabase/server`
- All data scoped by `account_id` via RLS policies
- Types: T-prefixed manual types in `src/db/types.ts` (e.g., `TTransaction`, `TInvoice`)
- Validations: Zod schemas in `src/lib/validations/index.ts`, infer with `z.infer<>`
- Server Actions in `src/actions/*.actions.ts` return `TApiResponse<T>`
- After mutations, call `revalidatePath("/relevant-path")`
- Use `logger` from `@/lib/logger` for structured logging
- Import components directly (no barrel exports)

### Server Action pattern

```typescript
"use server";
import { requireAccountAccess } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function actionName(accountId: string): Promise<TApiResponse<T>> {
  try {
    const { user, supabase } = await requireAccountAccess(accountId);
    // ... query
    revalidatePath("/relevant-path");
    return { data, error: null, success: true };
  } catch (error) {
    logger.error("Action failed", error);
    return { data: null, error: error.message, success: false };
  }
}
```

### Dependencies

- Depends on: US-NNN (if applicable)
- Blocks: US-NNN (if applicable)

## Testing

- [ ] Manual test: description
- [ ] Verify in browser at localhost:3000
```

---

## Rules

### Ordering and Dependencies

- Extract dependency order from the PRD's Functional Requirements
- Schema/migrations first, then types, then Server Actions, then components, then pages
- Mark dependencies explicitly in each task file

### Implementation Notes

For each task, analyze the PRD's Architecture Considerations and add:

- **Specific file paths** to modify or create
- **Which existing actions/components** to extend
- **Supabase changes** needed (migrations, RLS, triggers)
- **Permission checks** if applicable (`requireAuth()`, `requireAccountAccess(accountId)`, `requireAccountOwnership(accountId)` from `@/lib/supabase/server`)
- **Revalidation paths** for Server Actions (`revalidatePath()`)
- **Zod schemas** to add in `src/lib/validations/index.ts`

This is what makes the tasks actionable — a developer or AI agent should know exactly where to start.

### Task Sizing

Each task must fit in **one context window** without compression. Guidelines:

- **Max 3 files** to modify/create per task
- **~80 lines** of new code per task
- If a task touches both Server Action + component + page, it's too big — split it

If a User Story is too large, split it:

```
# Original US-003 is too big -> split into:
docs/tasks/02/US-003a_health-score-action.md
docs/tasks/02/US-003b_health-score-ui.md
```

Use letter suffixes (a, b, c) to keep the numbering aligned with the PRD.

### Include Real Types

When a task involves Supabase tables, **include the actual type definition** from `src/db/types.ts` in the task file. This prevents the implementer from guessing field names.

Example:
```typescript
// From src/db/types.ts — TTransaction type
export type TTransaction = {
  id: string;
  invoice_id: string;
  account_id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  installment: string | null;
  billing_date: string | null;
  created_at: string;
};
```

### Flag Missing Dependencies

If pre-research reveals a component or action referencing something that doesn't exist yet, **document it explicitly** in the task:

```markdown
### Missing dependency
The component `BudgetForecastChart` in `src/components/budget/forecast/` references
`getForecastData()` from `budget.actions.ts`, but this action does not exist yet.
This task creates it.
```

This prevents confusion when the implementer sees code referencing non-existent functions.

---

## INDEX.md Update

After generating tasks, update `docs/plans/INDEX.md`:

1. **Change PRD status** from "Draft" or "Aprovado" to "Em andamento"
2. **Update progress**: "0/N US"
3. **Add detail section** below the table:

```markdown
---

## PRD XX: Feature Name

| US     | Titulo         | Status   | Branch/PR |
| ------ | -------------- | -------- | --------- |
| US-001 | Title from PRD | Pendente | --        |
| US-002 | Title from PRD | Pendente | --        |
| US-003 | Title from PRD | Pendente | --        |
```

---

## Example

Given `docs/plans/02_financial-health-score.md` with 2 User Stories:

**Creates:**

```
docs/tasks/02/
├── US-001_display-health-score.md
└── US-002_health-score-trend.md
```

**US-001 file content:**

```markdown
# US-001: Display financial health score on dashboard

> **PRD**: `docs/plans/02_financial-health-score.md`
> **Task**: `docs/tasks/02/US-001_display-health-score.md`
> **Status**: Pendente

## Description

As an owner, I want to see a financial health score on the dashboard so I can quickly assess my financial situation.

## Acceptance Criteria

- [ ] Health score (0-100) displayed on DashboardStats component
- [ ] Color coding: green (70-100), yellow (40-69), red (0-39)
- [ ] Trend indicator arrow (up/down/stable) based on previous month comparison
- [ ] Score calculated from `transactions` table scoped by `account_id`
- [ ] Server Action returns score via `analytics.actions.ts`
- [ ] `npm run lint && npm run build` passes (Biome check + TypeScript compilation)
- [ ] Verify in browser at localhost:3000

## Implementation Notes

### Files to modify/create

- `src/lib/analytics/health-score.ts` -- extend existing health score utility with `calculateFinancialHealthScore()` function
- `src/db/types.ts` -- add `THealthScore` type with score (number), trend (enum)
- `src/lib/validations/index.ts` -- add `HealthScoreSchema` Zod schema
- `src/actions/analytics.actions.ts` -- extend with `getFinancialHealthScore(accountId)` action
- `src/components/dashboard/DashboardStats.tsx` -- add score badge with color coding

### Codigo atual (referencia)

```typescript
// From src/db/types.ts — TApiResponse pattern
export type TApiResponse<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

// From src/actions/analytics.actions.ts — existing action pattern
export async function getDashboardStats(accountId: string): Promise<TApiResponse<TDashboardStats>> {
  try {
    const { user, supabase } = await requireAccountAccess(accountId);
    // ...
  }
}
```

### Key patterns to follow

- Auth via `requireAccountAccess(accountId)` from `@/lib/supabase/server`
- All queries scoped by `account_id` (enforced by RLS)
- Types: T-prefixed in `src/db/types.ts`
- Server Actions return `TApiResponse<T>`
- After mutations, call `revalidatePath("/dashboard")`
- Use `logger` from `@/lib/logger` for structured logging

### Dependencies

- Depends on: none (first task)
- Blocks: US-002 (trend chart requires score calculation to exist)

## Testing

- [ ] Manual: Load dashboard -> verify health score card is displayed
- [ ] Manual: Verify color coding matches expected ranges
- [ ] Manual: Verify score trend indicator direction matches data
- [ ] Manual: Verify score not shown for accounts with insufficient data
```

**INDEX.md updated:**

```markdown
| 02 | [Financial Health Score](02_financial-health-score.md) | #42 | Em andamento | 0/2 US |
```

---

## Updating Task Status

When working on implementation, update task files:

1. **Starting a task**: Change status to `Em andamento` in task file header and INDEX.md detail
2. **Completing a task**: Check all acceptance criteria boxes, change status to `Concluida`, update INDEX.md progress
3. **All tasks done**: Update INDEX.md PRD status to "Concluido", remove detail section

---

## Context Systems

This project has **two separate context systems** — do not confuse them:

| System | Location | Purpose |
|--------|----------|---------|
| **Session context** | `.claude/tasks/context_session_X.md` | Developer diary — what was investigated, decided, tried |
| **PRD tasks** | `docs/tasks/XX/US-NNN_title.md` | Implementation tasks from PRDs |

**Cross-reference rule**: When generating tasks, check `.claude/tasks/` for prior session context about the feature. If found, reference it in the task's Implementation Notes so the implementer has background context.

---

## Checklist

Before finishing task generation:

- [ ] Read the PRD completely
- [ ] **Pre-research**: Verified `src/db/types.ts` type definitions for tables involved
- [ ] **Pre-research**: Checked Server Actions for existing functions in the feature domain
- [ ] **Pre-research**: Checked `.claude/tasks/` for prior session context
- [ ] **Pre-research**: Read root `CLAUDE.md` for architecture patterns
- [ ] Created `docs/tasks/XX/` folder
- [ ] One task file per User Story (with letter splits if needed)
- [ ] Each task has max 3 files, ~80 lines new code (fits in one context window)
- [ ] Each task has implementation notes with specific file paths
- [ ] Each task includes "Codigo atual (referencia)" with relevant code snippets
- [ ] Each task includes "Key patterns to follow" section
- [ ] Real DB types included for tasks involving Supabase tables
- [ ] Missing dependencies flagged where code references non-existent functions
- [ ] Acceptance criteria use `npm run lint && npm run build` (Biome check + TypeScript compilation)
- [ ] Dependencies marked between tasks
- [ ] Testing section with manual test steps
- [ ] Updated `docs/plans/INDEX.md` with status and detail section
