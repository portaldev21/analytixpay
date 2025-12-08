# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AnalytiXPay is a credit card invoice management system built with Next.js 15 and Supabase. It features automatic PDF parsing, transaction extraction, and categorization with multi-user account support.

**Stack:** Next.js 15 (App Router) + TypeScript 5 + Supabase + Tailwind CSS 4 + Biome

## Common Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack
npm run start        # Run production build

# Code Quality
npm run lint         # Run Biome linter
npm run format       # Format code with Biome

# Testing
npm run test                      # Run all unit tests with Vitest
npm run test:coverage             # Run tests with coverage report
npx vitest src/lib/env.test.ts    # Run a single test file

# Setup
npm install                        # Install dependencies
node scripts/setup-supabase.js     # Interactive Supabase setup
```

**IMPORTANT:** Never start the server automatically. Always ask the user to start it and test.

## Architecture

### App Router Structure

The project uses Next.js 15 App Router with route groups:

- `(auth)/` - Public authentication routes (login, signup)
- `(dashboard)/` - Protected routes requiring authentication
- Middleware (`src/middleware.ts`) handles session management and route protection

### Data Flow Pattern

1. **UI Components** (Client Components in `src/components/`) handle user interaction
2. **Server Actions** (`src/actions/*.actions.ts`) process requests with `'use server'` directive
3. **Supabase Helpers** (`src/lib/supabase/`) manage database access
4. **Database** enforces Row Level Security (RLS) policies

### Utility Libraries

- **Environment** (`src/lib/env.ts`) - Type-safe env vars with Zod validation, use `hasOpenAI()` helper
- **Logging** (`src/lib/logger.ts`) - Structured logging with context support
- **Rate Limiting** (`src/lib/rate-limit.ts`) - LRU cache-based rate limiting
- **Pagination** (`src/lib/pagination.ts`) - Reusable pagination helpers
- **Sanitization** (`src/lib/sanitize.ts`) - Input sanitization utilities
- **Analytics** (`src/lib/analytics/stats.ts`) - Centralized stats calculations
- **PDF Cache** (`src/lib/pdf/cache.ts`) - Hash-based PDF result caching

### Supabase Client Pattern

**Critical:** The codebase uses **two separate Supabase clients**:

- `src/lib/supabase/client.ts` - Browser client for Client Components (`'use client'`)
- `src/lib/supabase/server.ts` - Server client for Server Components and Server Actions

Server Actions and Server Components MUST use `createClient()` from `server.ts`.

### Server Actions Architecture

All data mutations use Server Actions in `src/actions/*.actions.ts`:

- Return type: `TApiResponse<T>` with `{ data, error, success }`
- Always call `revalidatePath()` after mutations
- Use auth helpers that throw on failure: `requireAuth()`, `requireAccountAccess(accountId)`, `requireAccountOwnership(accountId)`
- Use `logger` for structured logging and rate limiters for sensitive operations

```typescript
'use server'

import { requireAccountAccess } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function actionName(accountId: string): Promise<TApiResponse<T>> {
  try {
    const { user, supabase } = await requireAccountAccess(accountId)
    const { data, error } = await supabase.from('table').select()

    if (error) return { data: null, error: error.message, success: false }

    revalidatePath('/relevant-path')
    return { data, error: null, success: true }
  } catch (error) {
    logger.error('Action failed', error)
    return { data: null, error: error.message, success: false }
  }
}
```

### PDF Parsing System

PDF processing uses a **hybrid AI + regex approach**:

- **AI Parser** (`src/lib/pdf/ai-parser.ts`) - Uses OpenAI GPT-4o-mini, works with any Brazilian bank format
- **Regex Parser** (`src/lib/pdf/parser.ts`) - Fallback pattern-based extraction
- **Main Parser** (`parsePdfFile`) - Tries AI first (if `OPENAI_API_KEY` set), falls back to regex

Options: `parsePdfFile(buffer, { useAI: false, debug: true })`

### Authentication & Access Control

- Email/password + Google OAuth via Supabase Auth
- Multi-tenant: users can belong to multiple accounts
- Roles: `owner` (full control) vs `member` (limited access)
- All database queries filtered by RLS policies

Access check helpers in `src/lib/supabase/server.ts`:
- `getCurrentUser()` - Get authenticated user
- `hasAccessToAccount(accountId)` - Check account membership
- `isAccountOwner(accountId)` - Check owner privileges

### Database

**Location:** `src/db/`
- `schema.sql` - Main schema (execute in Supabase SQL Editor)
- `types.ts` - TypeScript types (prefixed with `T`, e.g., `TAccount`, `TTransaction`)
- `migrations/` - Applied migrations
- `README.md` - Complete database documentation

Main tables: `accounts`, `account_members`, `invoices`, `transactions`, `categories`, `profiles`

All tables have RLS enabled. Server-side access checks complement database policies.

### Type System

All types in `src/db/types.ts`:
- Database types match Supabase schema (Row/Insert/Update variants)
- Extended types for joins (e.g., `TInvoiceWithTransactions`)
- API response wrapper: `TApiResponse<T>`

### Component Architecture

- Shadcn UI components in `src/components/ui/`
- Feature components organized by route in `src/components/{feature}/`
- Shared components in `src/components/shared/`
- Client Components marked with `'use client'` directive

### Styling

- Tailwind CSS 4, dark mode by default (blue #3b82f6 + dark gray)
- Use `cn()` helper from `src/lib/utils.ts` for class merging
- Animations via Framer Motion

## Development Guidelines

- **Linting:** Biome (not ESLint/Prettier), 2-space indentation
- **TypeScript:** Strict mode, no `any` types
- **Imports:** Use alias `@/*` → `src/*`
- **Commit messages:** English, conventional commits format
- **Git:** Never execute git commands without explicit permission

### Validation Workflow

1. Verify TypeScript compilation (`npm run build`)
2. Run linter (`npm run lint`)
3. Run test suite (`npm run test`)
4. Test in browser (ask user to start dev server)

## Project-Specific Patterns

### PDF Upload Flow

1. User drops PDF → client-side validation (type, size)
2. Server Action uploads to Supabase Storage (`invoices` bucket)
3. PDF parsed with `parsePdfFile()`
4. Invoice record created, transactions batch-inserted
5. Paths revalidated, status: `processing` → `completed` | `error`

### Category System

Auto-categorization via keyword matching in `CATEGORY_KEYWORDS`:
- Brazilian merchant patterns (Alimentação, Transporte, Saúde, Lazer, etc.)
- Falls back to "Outros" (Other) if no match

### Multi-Account Architecture

- Users create/join accounts via `account_members` table
- Each account isolated by RLS policies
- All transactions scoped to `account_id`

## Environment Variables

Required in `.env.local` (validated at build time via `src/lib/env.ts`):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=sk-proj-...  # Optional, enables AI PDF parsing
```

Use `hasOpenAI()` and `isDevelopment()` helpers from `@/lib/env`.
