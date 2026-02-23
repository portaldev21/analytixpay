---
name: prd
description: 'Generate a Product Requirements Document (PRD) for a new feature. Use when planning a feature, starting a new project, or when asked to create a PRD. Triggers on: create a prd, write prd for, plan this feature, requirements for, spec out.'
user-invocable: true
---

# PRD Generator — ControleFatura (Gestao de Faturas)

Create numbered, structured Product Requirements Documents for the ControleFatura credit card invoice management platform.

---

## The Job

1. **Determine next PRD number**: Check `docs/plans/INDEX.md` for existing entries, find the highest number, increment by 1
2. Receive a feature description from the user
3. Ask 3-5 essential clarifying questions (with lettered options)
4. Generate a structured PRD based on answers
5. Save to `docs/plans/XX_nome-do-prd.md`
6. **Update `docs/plans/INDEX.md`**: Add new line in the PRDs table with status "Draft"

**Important:** Do NOT start implementing. Just create the PRD.

---

## Numbering Convention

PRDs are **sequentially numbered** with a two-digit prefix:

```
docs/plans/
├── 01_invoice-parsing-improvements.md
├── 02_budget-forecast-enhancements.md
├── 03_transaction-categorization.md
└── ...
```

**Rules:**

- Always run `ls docs/plans/` first to find the last number
- Increment by 1: if last is `03_`, next is `04_`
- Use zero-padded two digits: `01`, `02`, ..., `09`, `10`
- Name in kebab-case after the number: `XX_feature-name.md`
- If `docs/plans/` doesn't exist, create it and start at `01`

**Task folders** (for future implementation tracking):

```
docs/tasks/
├── 01/    <- tasks from PRD 01
├── 02/    <- tasks from PRD 02
└── ...
```

Include this mapping in the PRD header so implementers know where to track work.

---

## Step 0: Pre-Research (Before Questions)

Before asking clarifying questions, **gather context** from the codebase:

1. **Check GitHub issue** (if referenced): `gh issue view NNN` — extract requirements, comments, linked PRs
2. **Check existing actions/components**: Search for Server Actions and components that reference the feature domain
   ```
   Grep for the feature domain in src/actions/ and src/components/ to find existing code
   ```
3. **Check `types.ts`**: Verify real type definitions for tables involved — types are manually defined with T prefix (e.g., `TTransaction`, `TInvoice`)
   ```
   Grep for the table/type name in src/db/types.ts
   ```
4. **Check `package.json` scripts**: Use the correct verification commands (`npm run lint` for Biome check + `npm run build` for TypeScript compilation)
5. **Check `.claude/tasks/`**: Search for related session context files that may have prior investigation
   ```
   Grep for the feature keyword in .claude/tasks/context_session_*.md
   ```

This pre-research prevents writing PRDs with wrong field names, missing context, or referencing non-existent code.

---

## Step 1: Clarifying Questions

Ask only critical questions where the initial prompt is ambiguous. Focus on:

- **Problem/Goal:** What user or business problem does this solve?
- **Core Functionality:** What are the key actions?
- **Scope/Boundaries:** What should it NOT do?
- **Users & Permissions:** Which roles are affected? (Owner, Member)
- **Success Criteria:** How do we know it's done?

### Format Questions Like This:

```
1. What is the primary goal of this feature?
   A. Improve invoice parsing and extraction
   B. Enhance budget tracking and analysis
   C. Improve financial analytics and reporting
   D. Other: [please specify]

2. Which user roles are primarily affected?
   A. All roles (Owner, Member)
   B. Owner only
   C. All roles with different permission levels

3. What is the scope?
   A. Minimal viable version
   B. Full-featured implementation
   C. Backend only (Server Actions, Supabase queries)
   D. UI only (components, pages)
```

This lets users respond with "1A, 2C, 3B" for quick iteration. Remember to indent the options.

---

## Step 2: PRD Structure

Generate the PRD with these sections:

### Header

```markdown
# PRD XX: Feature Name

> **PRD**: `docs/plans/XX_feature-name.md`
> **Tasks**: `docs/tasks/XX/`
> **Issue**: #NNN (if applicable)
> **Date**: YYYY-MM-DD
```

### 1. Introduction/Overview

Brief description of the feature and what user or business problem it solves.

### 2. Goals

Specific, measurable objectives (bullet list).

### 3. User Stories

Each story needs:

- **Title:** Short descriptive name
- **Description:** "As a [role], I want [feature] so that [benefit]"
- **Acceptance Criteria:** Verifiable checklist

Each story should be small enough to implement in one focused session.

**Format:**

```markdown
### US-001: [Title]

**Description:** As a [owner/member], I want [feature] so that [benefit].

**Acceptance Criteria:**

- [ ] Specific verifiable criterion
- [ ] Another criterion
- [ ] `npm run lint && npm run build` passes (Biome check + TypeScript compilation)
- [ ] **[If UI]** Verify in browser at localhost:3000
- [ ] **[If Supabase]** Migration created and RLS policies defined
- [ ] **[If permissions]** Auth checks via `requireAuth()` / `requireAccountAccess()` / `requireAccountOwnership()`
```

**Important:**

- Acceptance criteria must be verifiable, not vague. "Works correctly" is bad. "Button shows confirmation dialog before deleting invoice" is good.
- For UI stories: always include browser verification
- For data stories: always include migration + RLS criteria

### 4. Functional Requirements

Numbered list of specific functionalities:

- "FR-1: The system must allow owners to..."
- "FR-2: When a user clicks X, the system must..."

Be explicit and unambiguous.

### 5. Non-Goals (Out of Scope)

What this feature will NOT include. Critical for managing scope.

### 6. Architecture Considerations

Map affected layers using the project architecture:

```
Supabase SQL    -> src/db/schema.sql + src/db/migrations/
Types           -> src/db/types.ts (manual T-prefixed types)
Validations     -> src/lib/validations/index.ts (Zod schemas)
Server Actions  -> src/actions/*.actions.ts
Lib/Utilities   -> src/lib/*
Components      -> src/components/{feature}/
Pages           -> src/app/(dashboard)/{page}/
UI Components   -> src/components/ui/ (shadcn/ui)
Auth            -> src/lib/supabase/server.ts (requireAuth, requireAccountAccess, requireAccountOwnership)
AI              -> src/lib/ai/
```

Include:

- Which existing actions/components to extend vs create new
- Supabase tables, RLS policies, or functions needed
- Permission checks needed (`requireAuth()`, `requireAccountAccess(accountId)`, `requireAccountOwnership(accountId)`)
- Server Actions to create or modify in `src/actions/*.actions.ts`
- Data revalidation paths via `revalidatePath()`

### 7. Success Metrics

How will success be measured from a user or business perspective?

### 8. Open Questions

Remaining questions or areas needing clarification.

---

## Writing for Implementers

The PRD reader may be a junior developer or AI agent. Therefore:

- Be explicit and unambiguous
- Reference specific files and actions by path
- Use the project's permission hierarchy: Owner > Member (2 roles only)
- Number requirements for easy reference
- Use concrete examples with credit card invoice/transaction context
- Reference `requireAuth()` / `requireAccountAccess(accountId)` / `requireAccountOwnership(accountId)` for auth patterns
- Reference `account_id` scoping via RLS for data isolation

---

## Output

- **Format:** Markdown (`.md`)
- **Location:** `docs/plans/`
- **Filename:** `XX_feature-name.md` (zero-padded number + kebab-case)
- **Task folder:** `docs/tasks/XX/` (created when implementation begins)

---

## Example PRD

```markdown
# PRD 02: Financial Health Score

> **PRD**: `docs/plans/02_financial-health-score.md`
> **Tasks**: `docs/tasks/02/`
> **Issue**: #42
> **Date**: 2026-02-23

## Introduction

Add a composite "financial health score" to the dashboard, combining spending patterns, budget adherence, and category distribution into a single 0-100 metric. Currently, users must check multiple data points to understand their financial health, making it hard to quickly identify areas needing attention.

## Goals

- Provide a single, glanceable metric for overall financial health
- Help users quickly identify problematic spending patterns
- Surface health trends over time (improving, declining, stable)
- Enable comparison across billing periods

## User Stories

### US-001: Display financial health score on dashboard

**Description:** As an owner, I want to see a financial health score on the dashboard so I can quickly assess my financial situation.

**Acceptance Criteria:**

- [ ] Health score (0-100) displayed on DashboardStats component
- [ ] Color coding: green (70-100), yellow (40-69), red (0-39)
- [ ] Trend indicator arrow (up/down/stable) based on previous month comparison
- [ ] Score calculated from `transactions` table scoped by `account_id`
- [ ] Server Action returns score via `analytics.actions.ts`
- [ ] `npm run lint && npm run build` passes (Biome check + TypeScript compilation)
- [ ] Verify in browser at localhost:3000

### US-002: Health score trend over time

**Description:** As an owner, I want to see how my financial health score changes over time so I can track improvement.

**Acceptance Criteria:**

- [ ] Line chart showing monthly health scores on analytics page
- [ ] Minimum 3 months of data required to show trend
- [ ] Chart uses Recharts (already in project)
- [ ] `npm run lint && npm run build` passes (Biome check + TypeScript compilation)
- [ ] Verify in browser at localhost:3000

## Functional Requirements

- FR-1: Create `calculateFinancialHealthScore()` utility in `src/lib/analytics/health-score.ts`
- FR-2: Score formula: spending patterns (40%) + budget adherence (30%) + category balance (30%)
- FR-3: Server Action in `analytics.actions.ts` includes `healthScore` and `healthTrend` in response
- FR-4: All queries scoped by `account_id` via RLS
- FR-5: DashboardStats component displays score with color coding
- FR-6: Analytics page shows trend chart

## Non-Goals

- No per-member health scores (account-level only)
- No custom weight configuration (fixed formula)
- No health score alerts (future PRD)
- No historical health score storage (calculated on demand)

## Architecture Considerations

| Layer          | Files                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Utility        | `src/lib/analytics/health-score.ts` (extend existing)                     |
| Types          | `src/db/types.ts` (add THealthScore type)                                 |
| Validations    | `src/lib/validations/index.ts` (add HealthScoreSchema Zod schema)         |
| Server Action  | `src/actions/analytics.actions.ts` (extend with health score action)      |
| Component      | `src/components/dashboard/DashboardStats.tsx` (add score display)         |
| Component      | `src/components/analytics/HealthTrendChart.tsx` (new)                     |
| Page           | `src/app/(dashboard)/analytics/page.tsx` (add trend chart)               |
| Auth           | Uses existing `requireAccountAccess(accountId)` pattern                   |

## Success Metrics

- Users can assess financial health within 3 seconds of loading dashboard
- Health score correlates with actual spending patterns
- No performance regression on dashboard load (< 2s)

## Open Questions

- Should health score update in real-time or be cached?
- What's the minimum data threshold before showing a score? (e.g., 1 full month of invoices)
```

---

## Index Management

**File:** `docs/plans/INDEX.md`

This is the single source of truth for all PRDs and their implementation status. It MUST be updated in these moments:

| Evento                 | Acao no INDEX.md                                                              |
| ---------------------- | ----------------------------------------------------------------------------- |
| PRD criado             | Adicionar linha com status "Draft" e progresso "0/N US"                       |
| PRD aprovado           | Mudar status para "Aprovado"                                                  |
| Implementacao iniciada | Mudar status para "Em andamento", adicionar secao de detalhe com User Stories |
| User Story concluida   | Atualizar progresso (ex: "2/4 US"), marcar US como "Concluida" no detalhe     |
| Todas US concluidas    | Mudar status para "Concluido", remover secao de detalhe                       |
| PRD cancelado          | Mudar status para "Cancelado"                                                 |

---

## Checklist

Before saving the PRD:

- [ ] Checked `docs/plans/INDEX.md` to determine next number
- [ ] Asked clarifying questions with lettered options
- [ ] Incorporated user's answers
- [ ] Header includes PRD path, tasks folder, issue, and date
- [ ] User stories are small and specific
- [ ] Acceptance criteria include `npm run lint && npm run build` (Biome check + TypeScript compilation), permissions, and Supabase where applicable
- [ ] Functional requirements are numbered and unambiguous
- [ ] Non-goals section defines clear boundaries
- [ ] Architecture section maps to project layers with file paths
- [ ] Saved to `docs/plans/XX_feature-name.md`
- [ ] **Updated `docs/plans/INDEX.md`** with new entry (status: Draft)
