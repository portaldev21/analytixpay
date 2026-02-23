---
name: ralph
description: 'Convert PRDs to prd.json for Ralph autonomous execution in ControleFatura. Use when you have an existing PRD and need to prepare it for a ralph-loop. Triggers on: convert this prd, turn this into ralph format, create prd.json from this, ralph json, prepare prd for ralph.'
user-invocable: true
---

# Ralph PRD Converter — ControleFatura

Converts existing PRDs from `docs/prd/` into `prd.json` format for autonomous execution via the `/ralph-loop` command.

---

## The Job

1. **Identify the PRD**: User provides PRD number or path. If not provided, read `docs/prd/INDEX.md` to list available PRDs.
2. **Read the PRD**: Parse `docs/prd/XX_feature-name.md`
3. **Check for existing task files**: If `docs/tasks/XX/` exists, use those for extra detail
4. **Convert to `prd.json`**: Save to project root as `prd.json`
5. **Suggest ralph-loop command**: Provide the `/ralph-loop` invocation

**Important:** Do NOT start implementing. Just create the prd.json.

---

## Output Format

```json
{
  "project": "ControleFatura",
  "prdNumber": "XX",
  "prdFile": "docs/prd/XX_feature-name.md",
  "tasksDir": "docs/tasks/XX/",
  "branchName": "feat/feature-name-kebab-case",
  "description": "[Feature description from PRD title/intro]",
  "userStories": [
    {
      "id": "US-001",
      "title": "[Story title]",
      "description": "As a [role], I want [feature] so that [benefit]",
      "taskFile": "docs/tasks/XX/US-001_title-kebab-case.md",
      "acceptanceCriteria": [
        "Criterion 1",
        "Criterion 2",
        "`npm run lint && npm run build` passes (lint + typecheck)"
      ],
      "filesToModify": [
        "src/components/budget/NewComponent.tsx",
        "src/actions/budget.actions.ts"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    }
  ]
}
```

### Fields Explained

| Field           | Source                                                                   |
| --------------- | ------------------------------------------------------------------------ |
| `prdNumber`     | Extracted from PRD filename (`01`, `02`, etc.)                           |
| `prdFile`       | Path to the original PRD                                                 |
| `tasksDir`      | Path to task files directory                                             |
| `branchName`    | Derived from feature name using project conventions                      |
| `taskFile`      | Path to the corresponding task file in `docs/tasks/XX/`                  |
| `filesToModify` | Extracted from PRD's Architecture section or task's Implementation Notes |

### Branch Naming

Use project conventions — NOT `ralph/` prefix:

| Type        | Format                           | Example                             |
| ----------- | -------------------------------- | ----------------------------------- |
| Feature     | `feat/feature-name`              | `feat/budget-forecast`              |
| Fix         | `fix/bug-description`            | `fix/pdf-parsing-inter`             |
| Improvement | `improvements/scope-description` | `improvements/analytics-perf`       |

---

## Story Size: The Number One Rule

**Each story must be completable in ONE ralph-loop iteration (one context window).**

Each iteration spawns a fresh Claude Code session with no memory of previous work. If a story is too big, the LLM runs out of context before finishing and produces broken code.

### Right-sized stories for ControleFatura:

- Add a new Server Action in `src/actions/*.actions.ts` with auth + Supabase query
- Create a React component using shadcn/ui
- Add a utility function in `src/lib/`
- Add types in `src/db/types.ts` (T-prefixed manual types)
- Create a page component in `src/app/(dashboard)/`
- Add a Zod validation schema in `src/lib/validations/index.ts`

### Too big (split these):

- "Build the budget forecast feature" → Split into: utility function, types, Server Action, forecast component, forecast page
- "Add transaction categorization improvement" → Split into: category keywords update, Server Action, UI component, settings page
- "Refactor invoice detail page" → Split into one story per section

**Rule of thumb:** If you cannot describe the change in 2-3 sentences, it is too big.

---

## Story Ordering: ControleFatura Architecture Layers

Stories execute in priority order. Earlier stories must not depend on later ones. Follow the project's layer pattern:

**Correct order:**

1. Supabase changes (SQL, RLS policies, functions)
2. Types (`src/db/types.ts` — T-prefixed manual types)
3. Lib/Utilities (`src/lib/*`)
4. Server Actions (`src/actions/*.actions.ts`)
5. Components (`src/components/{feature}/`)
6. Pages (`src/app/(dashboard)/`)

**Wrong order:**

1. Component that uses a Server Action that doesn't exist yet
2. The Server Action

---

## Acceptance Criteria: Must Be Verifiable

Each criterion must be something that can be CHECKED programmatically or visually.

### Good criteria (verifiable):

- "Server Action `getInvoiceStats()` returns `totalSpent` field in response"
- "BudgetCard displays daily budget with color: green (on track), yellow (warning), red (over budget)"
- "Transaction list includes category filter dropdown"
- "Data scoped by `account_id` via RLS policies"
- "Auth via `requireAccountAccess(accountId)`, returns error if unauthorized"
- "`npm run lint && npm run build` passes (lint + typecheck)"

### Bad criteria (vague):

- "Works correctly"
- "User can see the data easily"
- "Good UX"
- "Handles edge cases"

### Mandatory criteria for ALL stories:

```
"`npm run lint && npm run build` passes (lint + typecheck)"
```

### Additional criteria by story type:

| Story Type                 | Additional Criteria                                                      |
| -------------------------- | ------------------------------------------------------------------------ |
| **UI stories**             | "Verify in browser at localhost:3000"                                    |
| **Server Action stories**  | "Auth via `requireAccountAccess(accountId)`, returns error if unauthorized" |
| **Type stories**           | "T-prefixed types in `src/db/types.ts`"                                  |
| **Supabase stories**       | "RLS policies defined, migration in `src/db/migrations/`"               |
| **PDF parsing stories**    | "Uses `parsePdfFile()` from `src/lib/pdf/`"                             |

---

## Conversion Rules

1. **Read PRD first**: Always parse from `docs/prd/XX_feature-name.md`
2. **Check task files**: If `docs/tasks/XX/` exists, use task files for detailed implementation notes and `filesToModify`
3. **Each user story becomes one JSON entry**
4. **IDs**: Match PRD's US numbering (US-001, US-002, etc.)
5. **Priority**: Based on dependency order matching architecture layers
6. **All stories**: `passes: false` and empty `notes`
7. **Always add**: `npm run lint && npm run build` criterion to every story
8. **Extract `filesToModify`**: From PRD's Architecture section or task's Implementation Notes
9. **Permission roles**: Use the hierarchy: Owner > Member (2 roles only)
10. **Auth pattern**: Always reference `requireAuth()` or `requireAccountAccess(accountId)` from `@/lib/supabase/server` for Server Actions
11. **Data scoping**: All queries scoped by `account_id` via RLS policies

---

## Splitting Large Stories

If a PRD story is too big, split using letter suffixes (matching `/prd-tasks` convention):

**Original US-003 is too big → split into:**

```json
{
  "id": "US-003a",
  "title": "Budget forecast Server Action",
  "taskFile": "docs/tasks/02/US-003a_budget-forecast-action.md"
},
{
  "id": "US-003b",
  "title": "Budget forecast UI component",
  "taskFile": "docs/tasks/02/US-003b_budget-forecast-ui.md"
}
```

---

## Example

**Input:** `docs/prd/02_budget-forecast.md`

**Output `prd.json`:**

```json
{
  "project": "ControleFatura",
  "prdNumber": "02",
  "prdFile": "docs/prd/02_budget-forecast.md",
  "tasksDir": "docs/tasks/02/",
  "branchName": "feat/budget-forecast",
  "description": "Budget Forecast — Project future installment impact on daily budget with calendar visualization",
  "userStories": [
    {
      "id": "US-001",
      "title": "Forecast calculation utility",
      "description": "As an account owner, I want future installment projections calculated so I can see upcoming budget impact.",
      "taskFile": "docs/tasks/02/US-001_forecast-calculation.md",
      "acceptanceCriteria": [
        "Utility function calculates projected installments for next 6 months",
        "Uses `transactions` table with `installment` field to project future amounts",
        "Returns monthly totals and daily budget impact",
        "Data scoped by `account_id` via RLS policies",
        "`npm run lint && npm run build` passes (lint + typecheck)"
      ],
      "filesToModify": [
        "src/lib/budget/forecast.ts",
        "src/db/types.ts"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    },
    {
      "id": "US-002",
      "title": "Forecast Server Action and page",
      "description": "As an account owner, I want to view a forecast page so I can plan my spending for upcoming months.",
      "taskFile": "docs/tasks/02/US-002_forecast-page.md",
      "acceptanceCriteria": [
        "Server Action `getForecastData()` returns projected monthly totals",
        "Auth via `requireAccountAccess(accountId)`, returns error if unauthorized",
        "Forecast page at `/budget/forecast` renders projection chart and calendar",
        "Impact cards show monthly budget reduction from installments",
        "`npm run lint && npm run build` passes (lint + typecheck)",
        "Verify in browser at localhost:3000"
      ],
      "filesToModify": [
        "src/actions/budget.actions.ts",
        "src/components/budget/forecast/ImpactCard.tsx",
        "src/components/budget/forecast/ProjectionChart.tsx",
        "src/app/(dashboard)/budget/forecast/page.tsx"
      ],
      "priority": 2,
      "passes": false,
      "notes": "Depends on US-001"
    }
  ]
}
```

---

## After Conversion: Suggest Ralph Loop

After saving `prd.json`, suggest the ralph-loop command:

```
/ralph-loop "You are implementing PRD 02: Budget Forecast for ControleFatura. Read prd.json for the full spec. Work through user stories in priority order. For each story: read the task file, implement changes, run `npm run lint && npm run build`. Mark the story as passes:true in prd.json when done. Output <promise>PRD 02 COMPLETE</promise> when all stories pass." --completion-promise "PRD 02 COMPLETE" --max-iterations 20
```

**Important:** Adjust `--max-iterations` based on number and complexity of stories (roughly 2-3 iterations per story).

---

## Handling Existing prd.json

Before writing a new `prd.json`, check if one already exists:

1. Read the current `prd.json` if it exists
2. If `prdNumber` differs from the new PRD:
   - Archive to `archive/YYYY-MM-DD-prd-XX-feature-name/prd.json`
   - Then write the new file
3. If same `prdNumber`: overwrite (re-conversion of same PRD)

---

## Checklist Before Saving

Before writing prd.json, verify:

- [ ] Read PRD from `docs/prd/XX_feature-name.md`
- [ ] Checked `docs/tasks/XX/` for additional implementation details
- [ ] **Previous prd.json archived** (if exists with different prdNumber)
- [ ] Each story is completable in one iteration (small enough)
- [ ] Stories ordered by architecture layer (Supabase → types → lib/utilities → Server Actions → components → pages)
- [ ] Every story has `npm run lint && npm run build` criterion
- [ ] UI stories have "Verify in browser at localhost:3000"
- [ ] Server Action stories have auth via `requireAccountAccess(accountId)`
- [ ] Type stories use T-prefixed types in `src/db/types.ts`
- [ ] Supabase stories have RLS policies and migration file
- [ ] PDF parsing stories use `parsePdfFile()` from `src/lib/pdf/`
- [ ] Acceptance criteria are verifiable (not vague)
- [ ] No story depends on a later story
- [ ] `filesToModify` populated for every story
- [ ] Ralph-loop command suggested with appropriate `--max-iterations`
