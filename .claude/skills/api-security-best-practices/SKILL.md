---
name: api-security-best-practices
description: "Secure API design patterns for Next.js App Router with Supabase. Authentication, authorization, input validation, rate limiting, and OWASP API Top 10. Adapted for ControleFatura multi-tenant architecture."
---

# API Security Best Practices

Guide for building secure Server Actions and API routes in Next.js App Router with Supabase Auth. Covers authentication, authorization, input validation, and protection against OWASP API Top 10.

## When to Use

- Writing new Server Actions in `src/actions/*.actions.ts`
- Reviewing the streaming API route at `src/app/api/chat/route.ts`
- Reviewing existing Server Actions for security gaps
- Implementing RBAC checks for multi-tenant isolation
- Adding input validation with Zod
- Conducting API security reviews

**Key Architectural Note:** ControleFatura uses **Server Actions** (`'use server'` directive) for all data mutations — NOT API routes. The only API route is `src/app/api/chat/route.ts` for AI chat streaming (SSE). All security patterns below apply to both, but Server Actions are the primary surface.

---

## 1. Authentication & Authorization (ControleFatura Pattern)

### Standard Protected Server Action

```typescript
// src/actions/invoice.actions.ts
"use server";

import { requireAccountAccess } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import type { TApiResponse, TInvoice } from "@/db/types";

export async function getInvoices(
  accountId: string
): Promise<TApiResponse<TInvoice[]>> {
  try {
    // Step 1: Authenticate + Authorize (throws if not authenticated or no access)
    const { user, supabase } = await requireAccountAccess(accountId);

    // Step 2: Query with tenant isolation (RLS also enforces this)
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("account_id", accountId); // CRITICAL: tenant isolation

    if (error) {
      logger.error("Failed to fetch invoices", { error, accountId });
      return { data: null, error: error.message, success: false };
    }

    return { data, error: null, success: true };
  } catch (error) {
    logger.error("getInvoices failed", error);
    return { data: null, error: "Failed to fetch invoices", success: false };
  }
}
```

### Owner-Only Server Action

```typescript
// src/actions/account.actions.ts
"use server";

import { requireAccountOwnership } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { TApiResponse } from "@/db/types";

export async function deleteAccount(
  accountId: string
): Promise<TApiResponse<null>> {
  try {
    // Throws if user is not the account owner
    const { user, account, supabase } = await requireAccountOwnership(accountId);

    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", accountId);

    if (error) {
      logger.error("Failed to delete account", { error, accountId });
      return { data: null, error: error.message, success: false };
    }

    revalidatePath("/dashboard");
    return { data: null, error: null, success: true };
  } catch (error) {
    logger.error("deleteAccount failed", error);
    return { data: null, error: "Failed to delete account", success: false };
  }
}
```

### Protected API Route (Chat Streaming)

```typescript
// src/app/api/chat/route.ts
import { requireAuth } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    // Step 1: Authenticate (throws if not authenticated)
    const { user, supabase } = await requireAuth();

    // Step 2: Validate input, process request...
  } catch (error) {
    logger.error("[API] Chat error:", error);
    return new Response("Unauthorized", { status: 401 });
  }
}
```

### Auth Decision Tree

| Scenario | Helper |
|----------|--------|
| Any authenticated action (basic) | `requireAuth()` — returns `{ user, supabase }`, throws if unauthenticated |
| Action scoped to an account | `requireAccountAccess(accountId)` — returns `{ user, supabase, accountId }`, throws if no membership |
| Owner-only action (delete account, manage members) | `requireAccountOwnership(accountId)` — returns `{ user, account, supabase, accountId }`, throws if not owner |
| Non-throwing checks (conditional UI) | `getCurrentUser()`, `hasAccessToAccount(accountId)`, `isAccountOwner(accountId)` |

### RBAC Levels

ControleFatura uses a simple two-role system via the `account_members` table:

| Role | Capabilities |
|------|-------------|
| `owner` | Full control: manage members, delete account, all CRUD operations |
| `member` | Limited: view and create invoices/transactions, use budget, use AI chat |

```typescript
// Auth helpers in src/lib/supabase/server.ts
// These throw on failure — no need for manual 401/403 checks in Server Actions

const { user, supabase } = await requireAuth();
// Throws: "Not authenticated"

const { user, supabase, accountId } = await requireAccountAccess(accountId);
// Throws: "Not authenticated" or "No access to account"

const { user, account, supabase, accountId } = await requireAccountOwnership(accountId);
// Throws: "Not authenticated" or "Not account owner"
```

### Anti-Patterns

```typescript
// ❌ BAD: No auth check at all
"use server";
export async function getInvoices(accountId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("invoices").select("*");
  return data; // Exposes ALL invoices across all accounts!
}

// ❌ BAD: Auth but no tenant isolation
"use server";
export async function getInvoices(accountId: string) {
  const { supabase } = await requireAuth();
  const { data } = await supabase.from("invoices").select("*");
  // Missing .eq("account_id", accountId)!
  return data;
}

// ❌ BAD: Auth but no ownership check for destructive action
"use server";
export async function removeAccountMember(accountId: string, memberId: string) {
  const { supabase } = await requireAccountAccess(accountId);
  // Should use requireAccountOwnership() — only owners can remove members
  await supabase.from("account_members").delete().eq("id", memberId);
}

// ❌ BAD: Using raw return instead of TApiResponse
"use server";
export async function getInvoices(accountId: string) {
  const { supabase } = await requireAccountAccess(accountId);
  const { data } = await supabase.from("invoices").select("*");
  return data; // Should return { data, error, success } shape
}
```

---

## 2. Input Validation with Zod

### Server Action with Validation

```typescript
"use server";

import { z } from "zod";
import { requireAccountAccess } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { TApiResponse, TTransaction } from "@/db/types";

const UpdateTransactionSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
  description: z.string()
    .min(1, "Description required")
    .max(200, "Description too long")
    .trim(),
  amount: z.number().positive("Amount must be positive"),
  categoryId: z.string().uuid("Invalid category ID").optional(),
});

export async function updateTransaction(
  accountId: string,
  input: z.infer<typeof UpdateTransactionSchema>
): Promise<TApiResponse<TTransaction>> {
  try {
    const { user, supabase } = await requireAccountAccess(accountId);

    // Validate input
    const parsed = UpdateTransactionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        data: null,
        error: parsed.error.flatten().fieldErrors,
        success: false,
      };
    }

    const { transactionId, description, amount, categoryId } = parsed.data;

    // Update with tenant isolation
    const { data, error } = await supabase
      .from("transactions")
      .update({ description, amount, category_id: categoryId })
      .eq("id", transactionId)
      .eq("account_id", accountId) // Tenant isolation
      .select()
      .single();

    if (error) {
      logger.error("Failed to update transaction", { error, transactionId });
      return { data: null, error: error.message, success: false };
    }

    revalidatePath("/transactions");
    return { data, error: null, success: true };
  } catch (error) {
    logger.error("updateTransaction failed", error);
    return { data: null, error: "Failed to update transaction", success: false };
  }
}
```

### Validation Rules

| Data Type | Zod Pattern |
|-----------|-------------|
| IDs (UUID) | `z.string().uuid()` |
| Account ID | `z.string().uuid("Invalid account ID")` |
| Email | `z.string().email()` |
| Amount (BRL) | `z.number().positive()` |
| Date | `z.string().date()` or `z.coerce.date()` |
| Invoice status | `z.enum(["processing", "completed", "error"])` |
| Pagination | `z.number().int().min(1).max(100).default(20)` |
| Search query | `z.string().max(200).optional()` |
| Carry-over mode | `z.enum(["deficit_only", "full_carry", "reset"])` |

### Don't Trust Client Input

```typescript
// ❌ BAD: Using raw request body in Server Action
"use server";
export async function createExpense(accountId: string, data: any) {
  const { supabase } = await requireAccountAccess(accountId);
  await supabase.from("budget_expenses").insert(data); // Raw input!
}

// ✅ GOOD: Validate + use auth context for ownership
"use server";
const ExpenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(200).trim(),
  date: z.string().date(),
});

export async function createExpense(
  accountId: string,
  input: z.infer<typeof ExpenseSchema>
): Promise<TApiResponse<TBudgetExpense>> {
  const { user, supabase } = await requireAccountAccess(accountId);

  const parsed = ExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: "Invalid input", success: false };
  }

  const { data, error } = await supabase
    .from("budget_expenses")
    .insert({
      ...parsed.data,
      account_id: accountId, // From auth context, not client
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message, success: false };
  revalidatePath("/budget");
  return { data, error: null, success: true };
}
```

---

## 3. Error Handling (No Data Leaks)

```typescript
// ❌ BAD: Exposes database structure
catch (error) {
  return { data: null, error: error.message, success: false };
  // "duplicate key value violates unique constraint "invoices_pdf_hash_key""
}

// ✅ GOOD: Generic error + structured server-side logging
catch (error) {
  logger.error("Invoice creation failed", {
    error,
    accountId,
    userId: user.id,
  });
  return {
    data: null,
    error: "Failed to create invoice",
    success: false,
  };
}
```

### Error Response Standards

Server Actions return `TApiResponse<T>`:

| Condition | Response |
|-----------|----------|
| Invalid input | `{ data: null, error: "Invalid input" or Zod details, success: false }` |
| Not authenticated | Auth helpers throw (caught by try/catch) |
| Not authorized | Auth helpers throw (caught by try/catch) |
| Resource not found | `{ data: null, error: "Not found", success: false }` |
| Server error | `{ data: null, error: "Generic message", success: false }` (never expose details) |

For the chat API route (`/api/chat`), use standard HTTP responses:

| Status | When | Response |
|--------|------|----------|
| 400 | Invalid input | `{ error: "Invalid input" }` |
| 401 | Not authenticated | `{ error: "Unauthorized" }` |
| 429 | Rate limited | `{ error: "Too many requests" }` |
| 500 | Server error | `{ error: "Internal server error" }` |

---

## 4. Rate Limiting

### ControleFatura Rate Limiting Pattern

ControleFatura uses an LRU cache-based rate limiter from `src/lib/rate-limit.ts`:

```typescript
// Usage in Server Actions
import { rateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function sensitiveAction(): Promise<TApiResponse<null>> {
  try {
    const { user } = await requireAuth();

    // Rate limit by user ID
    const { success: allowed } = await rateLimit(user.id, {
      limit: 10,
      windowMs: 15 * 60 * 1000, // 10 requests per 15 minutes
    });

    if (!allowed) {
      return { data: null, error: "Too many requests", success: false };
    }

    // ... proceed with action
  } catch (error) {
    logger.error("sensitiveAction failed", error);
    return { data: null, error: "Action failed", success: false };
  }
}
```

### Rate Limit Targets

| Endpoint / Action | Limit | Window |
|-------------------|-------|--------|
| Login / Signup | 10 req | 15 min |
| PDF Upload (invoice parsing) | 5 req | 5 min |
| AI Chat (`/api/chat`) | 20 req | 5 min |
| Budget expense creation | 30 req | 5 min |

### Middleware-Level Protection

```typescript
// src/middleware.ts handles session refresh and route protection
// For additional rate limiting on the chat API route:
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/chat")) {
    // Rate limiting can be applied here for the streaming endpoint
  }
}
```

### Production Protection

- Vercel's built-in DDoS protection
- Supabase has built-in rate limiting for auth endpoints
- Application-level rate limiting via `src/lib/rate-limit.ts` for Server Actions

---

## 5. Security Headers

### Next.js Config

```typescript
// next.config.ts
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

module.exports = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
```

---

## OWASP API Security Top 10

| # | Vulnerability | ControleFatura Risk | Mitigation |
|---|--------------|---------------------|------------|
| 1 | **Broken Object Level Authorization** | Missing `account_id` filter in queries | Always filter by `account_id` + use `requireAccountAccess(accountId)` + RLS policies |
| 2 | **Broken Authentication** | Supabase session bypass | Use `requireAuth()` / `requireAccountAccess()` consistently in all Server Actions |
| 3 | **Broken Object Property Level Authorization** | Returning sensitive fields (e.g., internal IDs) | Use `.select()` to pick only needed columns |
| 4 | **Unrestricted Resource Consumption** | Large transaction lists, analytics queries, AI chat abuse | Pagination helpers from `src/lib/pagination.ts`, rate limiting on chat |
| 5 | **Broken Function Level Authorization** | Member accessing owner-only actions (delete account, manage members) | Use `requireAccountOwnership(accountId)` for destructive/admin actions |
| 6 | **Unrestricted Access to Sensitive Business Flows** | PDF upload abuse, budget manipulation | Rate limit invoice uploads and sensitive Server Actions |
| 7 | **SSRF** | AI agent (ControleIA) potentially fetching external URLs | Validate and sanitize inputs in AI pipeline, restrict URL patterns |
| 8 | **Security Misconfiguration** | Missing CORS, headers | Security headers in `next.config.ts`, Supabase RLS enabled on all tables |
| 9 | **Improper Inventory Management** | Undocumented Server Actions or API routes | Keep route structure documented in CLAUDE.md, single API route at `/api/chat` |
| 10 | **Unsafe Consumption of APIs** | Anthropic Claude API responses | Validate and sanitize AI responses before rendering, use `src/lib/sanitize.ts` |

---

## Security Checklist for New Server Actions

### Authentication & Authorization
- [ ] Uses `requireAuth()`, `requireAccountAccess(accountId)`, or `requireAccountOwnership(accountId)` as appropriate
- [ ] Auth helper throws automatically on failure (no manual 401/403 needed in Server Actions)
- [ ] Uses `requireAccountOwnership()` for owner-only actions (delete, manage members)
- [ ] All queries filter by `account_id` for tenant isolation (in addition to RLS)

### Input Validation
- [ ] Input validated with Zod schema before any database operation
- [ ] UUIDs validated with `z.string().uuid()`
- [ ] Amounts validated as positive numbers
- [ ] String inputs trimmed and length-limited
- [ ] No raw user input passed directly to database queries

### Error Handling
- [ ] Returns `TApiResponse<T>` shape: `{ data, error, success }`
- [ ] Generic error messages to client (no stack traces, no DB constraint names)
- [ ] Detailed errors logged server-side with `logger.error()`
- [ ] Calls `revalidatePath()` after successful mutations

### Data Protection
- [ ] Only necessary fields in `.select()` (no internal IDs, no auth tokens)
- [ ] No `user.id` (Supabase auth UUID) exposed to client unnecessarily
- [ ] Pagination implemented for list queries
- [ ] Rate limiting applied to sensitive operations (uploads, AI chat)

### For the Chat API Route (`/api/chat`)
- [ ] Uses `requireAuth()` at the top of the handler
- [ ] Input validated before sending to Anthropic API
- [ ] Streaming response properly handles errors
- [ ] Rate limited to prevent AI API cost abuse

---

## Related Skills

- `idor-testing` — IDOR vulnerability testing with ControleFatura multi-tenant examples (account_id isolation)
- `security-best-practices` — Next.js + React security spec
- `security-threat-model` — Repository-grounded threat modeling
- `broken-authentication` — Auth bypass testing
- `top-web-vulnerabilities` — OWASP-aligned vulnerability reference
