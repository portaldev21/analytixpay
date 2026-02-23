---
name: nextjs-supabase-auth
description: "Expert integration of Supabase Auth with Next.js App Router Use when: supabase auth next, authentication next.js, login supabase, auth middleware, protected route."
source: vibeship-spawner-skills (Apache 2.0)
---

# Next.js + Supabase Auth

You are an expert in integrating Supabase Auth with Next.js App Router.
You understand the server/client boundary, how to handle auth in middleware,
Server Components, Client Components, and Server Actions.

Your core principles:
1. Use @supabase/ssr for App Router integration
2. Handle tokens in middleware for protected routes
3. Never expose auth tokens to client unnecessarily
4. Use Server Actions for auth operations when possible
5. Understand the cookie-based session flow

## Capabilities

- nextjs-auth
- supabase-auth-nextjs
- auth-middleware
- auth-callback

## Requirements

- nextjs-app-router
- supabase-backend

## Patterns

### Supabase Client Setup

Create properly configured Supabase clients for different contexts

### Auth Middleware

Protect routes and refresh sessions in middleware

### Auth Callback Route

Handle OAuth callback and exchange code for session

## Anti-Patterns

### ❌ getSession in Server Components

### ❌ Auth State in Client Without Listener

### ❌ Storing Tokens Manually

## Related Skills

Works well with: `nextjs-app-router`, `supabase-backend`

## ControleFatura Auth Pattern

ControleFatura uses three Supabase client instances for different runtime contexts:

### Supabase Clients

| Client | File | Context |
|--------|------|---------|
| Browser | `src/lib/supabase/client.ts` | Client Components (`'use client'`) |
| Server | `src/lib/supabase/server.ts` | Server Components and Server Actions |
| Middleware | `src/middleware.ts` | Edge runtime, session refresh |

**Critical:** Server Actions and Server Components MUST use `createClient()` from `server.ts`. Never use the browser client in server-side code.

### Auth Helpers

All auth helpers are in `src/lib/supabase/server.ts`:

```typescript
// Returns { user, supabase } or throws if not authenticated
const { user, supabase } = await requireAuth();

// Returns { user, supabase, accountId } or throws if user has no access to this account
const { user, supabase, accountId } = await requireAccountAccess(accountId);

// Returns { user, account, supabase, accountId } or throws if user is not the account owner
const { user, account, supabase, accountId } = await requireAccountOwnership(accountId);
```

Non-throwing variants are also available:
- `getCurrentUser()` - Returns user or null
- `hasAccessToAccount(accountId)` - Returns boolean
- `isAccountOwner(accountId)` - Returns boolean

### Multi-Account Architecture

Users can belong to multiple accounts via the `account_members` join table:

- Each user can create or join multiple accounts
- Roles: `owner` (full control) or `member` (limited access)
- All data queries are scoped by `account_id` and enforced by RLS policies
- Server Actions always validate account access before data operations

### Cookie-Based Sessions

- Sessions are stored in cookies using `@supabase/ssr`
- Middleware (`src/middleware.ts`) refreshes sessions on every request
- Protected routes under `(dashboard)/` are guarded by middleware
- Public routes under `(auth)/` (login, signup) are accessible without auth

### OAuth Callback

- OAuth callback is handled at `/auth/callback` route
- Exchanges the auth code for a session using Supabase's `exchangeCodeForSession`
- Supports Google OAuth provider
- Auto-creates account for new OAuth users
