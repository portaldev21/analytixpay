# Session Context - Skill Files Adaptation for ControleFatura

## Session ID: 3
## Date: 2026-02-23
## Status: COMPLETED

---

## Summary

Adapted six `.claude/skills/` SKILL.md files to include ControleFatura-specific patterns, branding, and project conventions.

---

## What Was Done

### 1. nextjs-supabase-auth/SKILL.md
- Added "## ControleFatura Auth Pattern" section at the end
- Documented three Supabase clients (browser, server, middleware)
- Listed auth helpers: `requireAuth()`, `requireAccountAccess()`, `requireAccountOwnership()`
- Documented multi-account architecture via `account_members` table
- Described cookie-based sessions with middleware refresh
- Noted OAuth callback at `/auth/callback`

### 2. favicon/SKILL.md
- Replaced `bun add sharp` with `npm install sharp`
- Updated Finance/Banking row in Design Guidelines table to mention ControleFatura branding: Verde Esmeralda (#2C8A4B) + Azul Medio (#1D5A8F) with Merriweather/Inter/Roboto Mono fonts

### 3. playwright-e2e-builder/SKILL.md
- Updated auth setup example to use Supabase Auth pattern with Portuguese labels (Senha, Entrar)
- Added ControleFatura note callout explaining route groups and cookie-based sessions
- Added "## ControleFatura Route Groups" section before checklist explaining (auth)/ and (dashboard)/ groups
- Kept `localhost:3000` references consistent throughout
- Verified `npm run dev` is used in webServer config

### 4. senior-qa/SKILL.md
- Expanded Common Commands to include Vitest commands (test:coverage, single file, watch mode)
- Added `npm run lint && npm run build` as the full quality check (replacing any `npm run fix` pattern)
- Added "### ControleFatura Testing Notes" subsection with Vitest, Biome, and quality gate info

### 5. nextjs-best-practices/SKILL.md
- Replaced generic project structure with ControleFatura-specific structure
- Shows route groups: `(auth)/` and `(dashboard)/` with all sub-routes
- Includes `api/chat/route.ts`, `components/` (ui, shared, feature), and `actions/*.actions.ts`

### 6. api-security-best-practices/SKILL.md
- Full rewrite from MGM-Web patterns to ControleFatura patterns
- Replaced `getOrgContextFromCookies()` with `requireAuth()` / `requireAccountAccess(accountId)` / `requireAccountOwnership(accountId)`
- Replaced `org.organizationRootUserId` / `group_owner` with `account_id` tenant isolation
- Replaced `groups` table references with ControleFatura tables (invoices, transactions, budget_expenses)
- Replaced OrgContext interface (3 RBAC levels) with ControleFatura 2-role system (owner/member)
- Added Server Actions as primary pattern (not API routes); noted `/api/chat` as the only API route
- Updated Auth Decision Tree with ControleFatura helpers and non-throwing variants
- Updated Zod examples to ControleFatura entities (transactions, expenses, invoices)
- Updated OWASP table with ControleFatura-specific risks and mitigations
- Updated Security Checklist with ControleFatura auth helpers and TApiResponse pattern
- Added dedicated checklist section for the chat API route
- Replaced all `console.error` with `logger.error` from `@/lib/logger`
- Updated rate limiting section to use `src/lib/rate-limit.ts` LRU-based approach
- Updated Related Skills idor-testing description with ControleFatura context

---

## Files Modified

- `.claude/skills/nextjs-supabase-auth/SKILL.md`
- `.claude/skills/favicon/SKILL.md`
- `.claude/skills/playwright-e2e-builder/SKILL.md`
- `.claude/skills/senior-qa/SKILL.md`
- `.claude/skills/nextjs-best-practices/SKILL.md`
- `.claude/skills/api-security-best-practices/SKILL.md`
- `.claude/tasks/context_session_3.md` (this file)

---
