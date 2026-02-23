# Session Context - Rebranding AnalytiXPay → ControleFatura

## Date: 2026-01-04

## Summary
Complete rebranding and design system migration from "AnalytiXPay" (dark glassmorphism theme) to "ControleFatura" (clean professional financial theme).

## Changes Made

### Core Design System (`src/app/globals.css`)
- New color palette:
  - Primary: #2C8A4B (Verde Esmeralda)
  - Secondary: #1D5A8F (Azul Médio)
  - Background: #F5F7FA (Light mode default)
  - Surface: #FFFFFF
  - Error: #C62828
- Removed glassmorphism effects
- Added light mode as default with dark mode support
- Updated all CSS custom properties

### Typography (`src/app/layout.tsx`)
- Merriweather (serif) - titles
- Inter (sans-serif) - body text
- Roboto Mono - numeric values

### Branding Updates
- App name: AnalytiXPay → ControleFatura
- AI Assistant: AnalytiX → ControleIA
- Design System version: v2.0 → v3.0
- Package name: analytixpay → controlefatura

### Components Updated
- `src/components/ui/button.tsx` - Simplified to 6 variants, removed glass/purple
- `src/components/ui/card-glass.tsx` - Simplified variants: default, muted, primary, secondary, outline
- `src/components/ui/badge.tsx` - Updated variants: default, secondary, destructive, outline, success, info, warning
- `src/components/ui/input.tsx` - Updated to new color scheme
- `src/components/ui/chip.tsx` - Updated to new color scheme
- `src/components/ui/progress.tsx` - Updated to new color scheme
- All dashboard components updated to use new CSS variables
- All budget components updated
- All analytics components updated

### Files Modified (Key)
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/(auth)/layout.tsx`
- `src/components/dashboard/Sidebar.tsx`
- `src/components/dashboard/Header.tsx`
- `src/lib/ai/prompts.ts`
- `src/lib/utils.ts` (category colors)
- `package.json`
- `CLAUDE.md`
- `README.md`

### Bulk Replacements
- `--color-primary-start` → `--color-primary`
- `--color-primary-end` → `--color-secondary`
- `--color-card-dark-1` → `--color-surface`
- `--color-card-dark-2` → `--color-surface-muted`
- `--color-card-dark-3` → `--color-surface-muted`
- `--glass-border` → `--color-border-light`
- `--shadow-glow-green` → `--shadow-md`
- `--shadow-card` → `--shadow-lg`
- `variant="glass"` → `variant="outline"`
- `variant="purple"` → `variant="info"`
- `variant="positive"` → `variant="success"`
- Removed all `hoverGlow` props

## Validation
- Build: PASSED (`npm run build`)
- Lint: Minor pre-existing issues (not related to rebranding)

## Next Steps
- User should test the application visually in the browser
- Consider adding favicon/logo assets if not already present

## Branch
`fix/oauth-callback-session`

---

## Session Update: 2026-02-23 - Skill Files Adaptation

### Summary
Adapted all four `.claude/skills/` SKILL.md files from the original MGM-Web project patterns to ControleFatura project conventions.

### Files Modified

#### `.claude/skills/stripe/SKILL.md`
- Replaced `getOrgContextFromCookies()` with `requireAuth()` from `@/lib/supabase/server`
- Replaced `createAdminClient()` with `createClient()` from `@/lib/supabase/server`
- Changed `org.userId` to `user.id` (from requireAuth)
- Changed `NEXT_PUBLIC_SITE_URL` to `NEXT_PUBLIC_APP_URL`
- Changed port 3003 to 3000 everywhere
- Changed `src/lib/types.ts` reference to `src/db/types.ts`
- Replaced `users` table queries with `profiles` table queries (ControleFatura pattern)
- Removed entire MGM database schema section (users/subscriptions tables)
- Added ControleFatura-specific schema with RLS policies and `accounts` table integration
- Updated idempotency key example to use `user.id`
- Updated common issues table (port 3003 -> 3000)

#### `.claude/skills/abacatepay/SKILL.md`
- Replaced `bun add` with `npm install`
- Added ControleFatura integration note at top
- Changed `NEXT_PUBLIC_APP_URL` to `http://localhost:3000`
- Added full Server Action example using `requireAuth()`, `TApiResponse`, `logger`
- Added webhook API route example using ControleFatura auth patterns
- Updated product names to "ControleFatura Pro"

#### `.claude/skills/posthog/SKILL.md`
- Changed title from "PostHog no MGM" to "PostHog no ControleFatura"
- Updated architecture table paths:
  - `src/providers/posthog-provider.tsx` -> `src/components/shared/posthog-provider.tsx`
  - `src/lib/posthog-server.ts` -> `src/lib/analytics/posthog.ts`
- Removed `useTrackSection` hook references entirely
- Removed `src/lib/posthog-api.ts` reference (HogQL section made generic)
- Replaced all MGM event names with ControleFatura equivalents:
  - `group:add_start` -> `invoice:upload_start`
  - `billing:checkout_complete` -> `invoice:parse_complete`
  - `group:add_success` -> `transaction:categorize_success`
- Added complete ControleFatura event taxonomy: auth:, invoice:, transaction:, budget:, analytics:, chat:
- Updated user identification example to use ControleFatura profile fields
- Added PostHog provider setup example for ControleFatura

#### `.claude/skills/cloudflare/SKILL.md`
- Removed ALL Clerk references and Clerk DNS sections (Step 3)
- Removed Clerk from description and workflow
- Replaced with Supabase Auth context note
- Added Step 4 for optional Supabase custom domain setup
- Replaced `bun add -g` with `npm install -g`
- Updated interactive prompts (removed Clerk DNS paste, added Supabase custom domain question)
- Updated troubleshooting table (Clerk -> Supabase)
- Updated R2 examples to use ControleFatura bucket names and domains
- Kept Vercel, email routing, and R2 sections intact (valid for ControleFatura)

#### `.claude/skills/idor-testing/SKILL.md`
- Replaced all "MGM-Web" references with "ControleFatura"
- Changed `group_owner` isolation to `account_id` isolation via `requireAccountAccess()`
- Replaced API route endpoints with ControleFatura Server Actions (`src/actions/*.actions.ts`)
- Noted single API route: `POST /api/chat` for AI streaming
- Replaced `getOrgContextFromCookies()` with `requireAccountAccess(accountId)` pattern
- Updated RBAC from 3 levels (Owner/Admin/Member) to 2 levels (owner/member)
- Replaced `org.canManageUsers`/`org.canCreateGroups` with `requireAccountOwnership()`
- Removed user ID enumeration section (ControleFatura uses UUIDs, not auto-incrementing IDs)
- Added chat conversation access as a medium-risk area
- Added Supabase Storage path traversal to testing checklist
- Updated all code examples to use `TApiResponse<T>`, `requireAuth()`, `requireAccountAccess()`, `requireAccountOwnership()`
- Updated tables from groups/alerts to invoices/transactions/budgets/accounts
- Renamed "Remediation (MGM-Web Patterns)" to "Remediation (ControleFatura Patterns)"
- Emphasized Server Actions as primary attack surface
- Added RLS defense-in-depth remediation section
- Added Supabase Storage protection guidance
