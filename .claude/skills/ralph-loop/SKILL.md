---
name: ralph-loop
description: 'Use when you have a prd.json ready and want to autonomously implement all user stories in sequence. Triggers on: ralph-loop, execute prd, implement stories, run ralph, start implementation loop.'
user-invocable: true
---

# Ralph Loop — Autonomous PRD Executor

Reads `prd.json` from project root and implements user stories one by one in priority order. Each story is self-contained: read task file, implement, verify, mark as passed.

---

## Arguments

```
/ralph-loop "<system-prompt>" --completion-promise "<promise-text>" --max-iterations <N>
```

| Argument | Required | Description |
|----------|----------|-------------|
| `system-prompt` | Yes | Context for the implementation session |
| `--completion-promise` | No | Text to output when all stories pass (default: "PRD COMPLETE") |
| `--max-iterations` | No | Max stories to process in this session (default: 20) |

If no arguments provided, use defaults and read context from `prd.json`.

---

## The Loop

```
FOR each story in prd.json (sorted by priority, where passes = false):

  1. READ the task file (story.taskFile)
  2. READ all files listed in story.filesToModify (understand current state)
  3. IMPLEMENT the changes described in the task file
  4. RUN `npm run lint && npm run build` to verify
  5. IF verification passes:
     - Update prd.json: set story.passes = true
     - Add note with summary of what was done
  6. IF verification fails:
     - Fix the errors
     - Re-run `npm run lint && npm run build`
     - If still failing after 3 attempts, add error to story.notes and move on
  7. CHECK: Are all stories done? → Output completion promise

END FOR
```

---

## Step-by-Step Execution

### Step 0: Load Context

1. Read `prd.json` from project root
2. Parse the system prompt argument for additional context
3. Count pending stories (`passes: false`)
4. If zero pending → output completion promise immediately
5. Read the PRD file (`prd.json.prdFile`) for overall context

### Step 1: Pick Next Story

1. Sort stories by `priority` (ascending)
2. Find first story where `passes === false`
3. If none found → all done → output completion promise

### Step 2: Understand the Story

1. Read the task file at `story.taskFile`
2. Read every file listed in `story.filesToModify`
3. Read any folder-specific `CLAUDE.md` for directories being modified
4. Understand acceptance criteria — these are your definition of done

### Step 3: Implement

1. Follow the task file's Implementation Notes section
2. Create or modify files as described
3. Follow the "Key patterns to follow" section
4. Respect dependencies listed in the task

**Rules:**
- Follow existing codebase patterns (read before writing)
- Use `requireAuth()` or `requireAccountAccess(accountId)` from `@/lib/supabase/server` for Server Actions
- Types use T-prefix in `src/db/types.ts` (e.g., `TAccount`, `TTransaction`)
- Server Actions return `TApiResponse<T>` with `{ data, error, success }`
- Server Actions call `revalidatePath()` after mutations
- Use `cn()` helper from `@/lib/utils` for class merging in components
- Do NOT modify files outside the story's scope

### Step 4: Verify

1. Run `npm run lint && npm run build`
2. Check each acceptance criterion:
   - Can you confirm it programmatically? (grep, file existence, lint/build output)
   - Mark criteria you cannot verify automatically in notes

### Step 5: Update prd.json

On success:
```json
{
  "passes": true,
  "notes": "Implemented: [brief summary]. Verified: lint + build passes."
}
```

On failure (after 3 attempts):
```json
{
  "passes": false,
  "notes": "BLOCKED: [error description]. Manual intervention needed."
}
```

### Step 6: Next or Done

- If more stories remain → go to Step 1
- If `--max-iterations` reached → stop, report progress
- If all stories pass → output completion promise

---

## Completion Promise

When all stories in prd.json have `passes: true`:

```
<promise>[completion-promise text]</promise>
```

Default: `<promise>PRD COMPLETE</promise>`

---

## Special Story Types

### SQL-only stories (migrations)

- Create the `.sql` file in `src/db/migrations/` as described
- Verify file exists and has expected content (grep for table names)
- Mark as passed — user executes SQL manually in Supabase Dashboard
- Add note: "SQL file created at `src/db/migrations/XXX.sql`. User must execute in Supabase Dashboard."

### Environment variable stories

- Modify `.env.example` only (NEVER `.env.local`)
- Verify the variables are present in the file
- Update `src/lib/env.ts` if Zod validation needs new vars
- Mark as passed

### Type regeneration stories (db:types)

- These depend on SQL being applied to the database first
- If migration hasn't been applied, mark as BLOCKED
- Add note: "Depends on US-XXX migration being applied to database first. Run `npm run db:types` after."

### Verification-only stories (seeds, checks)

- If the work was already done in another story, verify and mark as passed
- Add note: "Verified: data/changes from US-XXX cover this story."

---

## Error Recovery

| Error | Action |
|-------|--------|
| Lint fails | Read error output, fix, retry (max 3) |
| Build fails | Check for type errors, fix imports, retry (max 3) |
| File not found | Check if dependency story needs to run first |
| Task file missing | Skip story, add BLOCKED note |
| prd.json malformed | Stop, report to user |

---

## Progress Reporting

After each story completion, output:

```
[US-XXX] PASSED - Title (N/M stories complete)
```

After each failure:

```
[US-XXX] BLOCKED - Title - Reason
```

At session end:

```
Progress: N/M stories passed
Blocked: X stories need manual intervention
Remaining: Y stories pending

[If all passed]: <promise>PRD COMPLETE</promise>
```

---

## Example Session

```
Reading prd.json... PRD 07: Transaction Categorization Improvement
4 stories pending, 0 passed, 0 blocked

--- Story 1/4: US-001 (priority 1) ---
Reading: docs/tasks/07/US-001_migracao-sql-categorias.md
Creating: src/db/migrations/007_category_improvements.sql
Verifying: SQL file contains category_rules table and RLS policies... OK
Running: npm run lint && npm run build... PASSED
[US-001] PASSED - Migracdo SQL Categorias (1/4 stories complete)

--- Story 2/4: US-002 (priority 2) ---
Reading: docs/tasks/07/US-002_tipos-categoria-rules.md
Modifying: src/db/types.ts
Verifying: TCategoryRule type with T-prefix... OK
Running: npm run lint && npm run build... PASSED
[US-002] PASSED - Tipos Category Rules (2/4 stories complete)

--- Story 3/4: US-003 (priority 3) ---
Reading: docs/tasks/07/US-003_server-action-categorization.md
Creating: src/actions/category.actions.ts
Running: npm run lint && npm run build... PASSED
[US-003] PASSED - Server Action Categorization (3/4 stories complete)

--- Story 4/4: US-004 (priority 4) ---
Reading: docs/tasks/07/US-004_categoria-settings-ui.md
Creating: src/components/settings/CategoryRulesManager.tsx
Modifying: src/app/(dashboard)/settings/page.tsx
Running: npm run lint && npm run build... PASSED
[US-004] PASSED - Category Settings UI (4/4 stories complete)

Progress: 4/4 stories passed

<promise>PRD 07 COMPLETE</promise>
```

---

## Checklist (Internal)

Before marking a story as passed:

- [ ] Task file was read completely
- [ ] All `filesToModify` were read before changes
- [ ] Implementation follows task's "Key patterns to follow"
- [ ] `npm run lint && npm run build` passes with zero errors
- [ ] prd.json updated with `passes: true` and notes
- [ ] No files outside story scope were modified
