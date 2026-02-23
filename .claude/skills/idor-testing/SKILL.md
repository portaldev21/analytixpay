---
name: IDOR Vulnerability Testing
description: This skill should be used when the user asks to "test for insecure direct object references," "find IDOR vulnerabilities," "exploit broken access control," "enumerate user IDs or object references," or "bypass authorization to access other users' data." Adapted for ControleFatura multi-tenant architecture.
metadata:
  author: zebbern (adapted for ControleFatura)
  version: "2.0"
---

# IDOR Vulnerability Testing

## Purpose

Systematic methodologies for identifying Insecure Direct Object Reference (IDOR) vulnerabilities. Adapted for ControleFatura's multi-tenant architecture where `account_id` isolation is the primary security boundary.

## ControleFatura IDOR Risk Areas

### Critical: Multi-Tenant Account Isolation

ControleFatura uses `account_id` filtering enforced by auth helpers (`requireAccountAccess(accountId)`) and Supabase Row Level Security (RLS) policies to isolate tenant data. If any Server Action or API route bypasses these checks, **all data from all accounts is exposed**.

**Primary attack surface:** Server Actions in `src/actions/*.actions.ts` handle all data mutations. There is only ONE API route: `src/app/api/chat/route.ts` for AI chat streaming.

#### High-Risk Server Actions to Test

```
# Invoice data — MUST validate account access
invoiceActions.uploadInvoice(accountId, formData)
invoiceActions.getInvoices(accountId)
invoiceActions.getInvoiceById(accountId, invoiceId)
invoiceActions.deleteInvoice(accountId, invoiceId)

# Transaction data — MUST validate account access
transactionActions.getTransactions(accountId, filters)
transactionActions.updateTransaction(accountId, transactionId, data)

# Budget data — MUST validate account access
budgetActions.getBudgetConfig(accountId)
budgetActions.updateBudgetConfig(accountId, config)
budgetActions.getExpenses(accountId, filters)
budgetActions.addExpense(accountId, data)
budgetActions.deleteExpense(accountId, expenseId)
budgetActions.getWeekCycles(accountId)
budgetActions.getForecast(accountId)
budgetActions.getReconciliationSuggestions(accountId)

# Analytics — MUST validate account access
analyticsActions.getDashboardStats(accountId)
analyticsActions.getCategoryBreakdown(accountId)

# Chat — MUST validate account access
chatActions.getConversations(accountId)
chatActions.getMessages(accountId, conversationId)
chatActions.createConversation(accountId)

# Account management — MUST validate ownership
accountActions.updateAccount(accountId, data)
accountActions.deleteAccount(accountId)
accountActions.inviteMember(accountId, email)
accountActions.removeMember(accountId, memberId)

# API route — MUST validate account access
POST /api/chat (streaming AI responses — verifies account context)
```

#### Correct Pattern (ControleFatura)

```typescript
// ✅ SECURE: Always use requireAccountAccess() to validate tenant access
"use server";

import { requireAccountAccess } from "@/lib/supabase/server";

export async function getInvoices(accountId: string): Promise<TApiResponse<TInvoice[]>> {
  try {
    const { user, supabase } = await requireAccountAccess(accountId);

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("account_id", accountId); // RLS also enforces this, but explicit is better

    if (error) return { data: null, error: error.message, success: false };
    return { data, error: null, success: true };
  } catch (error) {
    return { data: null, error: error.message, success: false };
  }
}
```

#### Vulnerable Pattern (What to look for)

```typescript
// ❌ VULNERABLE: No account access check — exposes ALL tenants' data
"use server";

import { requireAuth } from "@/lib/supabase/server";

export async function getInvoices(accountId: string): Promise<TApiResponse<TInvoice[]>> {
  try {
    const { user, supabase } = await requireAuth(); // Only checks auth, NOT account access!

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("account_id", accountId); // Attacker can pass ANY accountId

    if (error) return { data: null, error: error.message, success: false };
    return { data, error: null, success: true };
  } catch (error) {
    return { data: null, error: error.message, success: false };
  }
}
```

```typescript
// ❌ VULNERABLE: No account filter at all — returns everything
"use server";

export async function getInvoiceById(invoiceId: string): Promise<TApiResponse<TInvoice>> {
  const { supabase } = await requireAuth();

  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId) // Missing account_id check!
    .single();

  return { data, error: null, success: true };
}
```

### Critical: RBAC Level Bypass

ControleFatura has 2 permission levels: `owner` (full control) and `member` (limited access), stored in the `account_members` table.

```typescript
// Test: Can a member access owner-only Server Actions?
// Actions that should use requireAccountOwnership():
accountActions.deleteAccount(accountId)
accountActions.updateAccount(accountId, data)
accountActions.inviteMember(accountId, email)
accountActions.removeMember(accountId, memberId)

// ❌ VULNERABLE: Only checks access, not ownership level
export async function deleteAccount(accountId: string) {
  const { supabase } = await requireAccountAccess(accountId); // Allows members!
  // Missing: requireAccountOwnership(accountId) — should throw for non-owners
}
```

### Medium: Cross-Account Resource Access

```
# Test: Can Account A's user access Account B's invoice?
getInvoiceById(accountId_A, invoiceId_belonging_to_B)

# Secure check in Server Action:
const { user, supabase } = await requireAccountAccess(accountId);
const { data: invoice } = await supabase
  .from("invoices")
  .select("*")
  .eq("id", invoiceId)
  .eq("account_id", accountId) // Must have this
  .single();
```

### Medium: Chat Conversation Access

```
# Test: Can User A access User B's chat conversations?
chatActions.getMessages(accountId, conversationId_belonging_to_other_user)

# Secure check must verify BOTH account access AND conversation ownership:
const { user, supabase } = await requireAccountAccess(accountId);
const { data } = await supabase
  .from("chat_messages")
  .select("*, chat_conversations!inner(*)")
  .eq("chat_conversations.id", conversationId)
  .eq("chat_conversations.account_id", accountId) // Must verify account
  .eq("chat_conversations.user_id", user.id);      // Must verify user
```

## General IDOR Testing Methodology

### 1. IDOR Types

**Direct Reference to Database Objects (Server Actions):**
```
# Call Server Action with a different account's resource UUID
getInvoiceById("attacker-account-id", "victim-invoice-uuid")
```

**Direct Reference to Static Files (Supabase Storage):**
```
# Supabase Storage URLs for invoice PDFs
/storage/v1/object/public/invoices/account-uuid/invoice.pdf
→ try accessing with a different account's path
```

### 2. Detection Techniques

#### Server Action Parameter Manipulation

```typescript
// Step 1: Normal call from Account A
const result = await getInvoices("account-a-uuid");

// Step 2: Tamper accountId to Account B's UUID
const result = await getInvoices("account-b-uuid");

// VULNERABLE if: Returns Account B's invoices using Account A's session
```

#### Request Body Manipulation (API Route)

```json
// POST /api/chat — Original request (own account)
{"accountId": "my-account-uuid", "message": "What are my expenses?"}

// Modified (target another account)
{"accountId": "victim-account-uuid", "message": "What are my expenses?"}
```

#### Server Action Direct Invocation

```typescript
// Server Actions can be invoked directly via POST to their internal endpoint
// Test: Call budget actions with another account's UUID
await addExpense("victim-account-uuid", {
  amount: 100,
  description: "Test",
  category_id: "some-category-uuid"
});
```

### 3. Common IDOR Locations

| Location | ControleFatura Examples |
|----------|------------------------|
| Server Action params | `accountId` param in all `*.actions.ts` functions |
| Resource UUIDs | `invoiceId`, `transactionId`, `expenseId`, `conversationId` |
| API route body | `accountId` in `/api/chat` request body |
| Supabase Storage paths | `/invoices/{account_id}/{filename}` |
| Supabase filters | Missing `.eq("account_id", accountId)` in queries |

### 4. Testing Checklist

| Test | Method | IDOR Indicator |
|------|--------|----------------|
| Swap accountId in Server Action | Pass different account's UUID | Returns different account's data |
| Cross-account resource access | Use invoiceId from Account B with Account A's session | Returns cross-account data |
| Member accessing owner actions | Member calls `deleteAccount()` or `inviteMember()` | Action succeeds without ownership check |
| Chat conversation access | Use conversationId from different user | Returns other user's chat messages |
| Storage path traversal | Access invoice PDF with different account UUID in path | Downloads other account's PDF |
| Budget config tampering | Modify another account's budget config | Config updated for wrong account |

### 5. Response Analysis

| Status | Interpretation |
|--------|----------------|
| `{ success: true }` | Potential IDOR -- verify data ownership in response |
| `{ success: false, error: "Access denied" }` | `requireAccountAccess()` working correctly |
| `{ success: false, error: "Not found" }` | Could be secure (RLS filtering) or missing resource |
| `{ success: false, error: "Not authenticated" }` | `requireAuth()` working correctly |
| `{ success: false, error: "Owner access required" }` | `requireAccountOwnership()` working correctly |
| 500 Error | Possible input validation gap |

## Remediation (ControleFatura Patterns)

### Always Use requireAccountAccess() for Tenant Isolation

```typescript
// ✅ Every Server Action that accesses account data MUST use requireAccountAccess()
"use server";

import { requireAccountAccess } from "@/lib/supabase/server";

export async function getTransactions(accountId: string): Promise<TApiResponse<TTransaction[]>> {
  try {
    const { user, supabase } = await requireAccountAccess(accountId);

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accountId);

    if (error) return { data: null, error: error.message, success: false };
    return { data, error: null, success: true };
  } catch (error) {
    return { data: null, error: error.message, success: false };
  }
}
```

### Use requireAccountOwnership() for Owner-Only Actions

```typescript
// ✅ Check ownership level before destructive or admin actions
"use server";

import { requireAccountOwnership } from "@/lib/supabase/server";

export async function deleteAccount(accountId: string): Promise<TApiResponse<null>> {
  try {
    const { user, account, supabase } = await requireAccountOwnership(accountId);
    // Only owners reach this point — members get an error thrown

    await supabase.from("accounts").delete().eq("id", accountId);
    return { data: null, error: null, success: true };
  } catch (error) {
    return { data: null, error: error.message, success: false };
  }
}
```

### Verify Resource Ownership Before Detail Access

```typescript
// ✅ Verify resource belongs to account before returning details
const { user, supabase } = await requireAccountAccess(accountId);

const { data: invoice } = await supabase
  .from("invoices")
  .select("*")
  .eq("id", invoiceId)
  .eq("account_id", accountId) // Double-check: auth helper + explicit filter
  .single();

if (!invoice) {
  return { data: null, error: "Not found", success: false };
}
```

### Rely on RLS as Defense in Depth

```typescript
// ✅ Supabase RLS policies provide a second layer of protection
// Even if app code misses a check, RLS should block cross-tenant access
// BUT: Never rely on RLS alone — always use requireAccountAccess() in Server Actions

// Test RLS by attempting direct Supabase queries without auth helpers:
// If RLS is misconfigured, app-level checks are the last defense
```

### Protect Supabase Storage Paths

```typescript
// ✅ Invoice PDFs stored with account_id in the path
// Storage policies should restrict access to the owning account
const storagePath = `${accountId}/${filename}`;
await supabase.storage.from("invoices").upload(storagePath, file);
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| All Server Actions return access denied | Verify session cookie is valid; check `account_members` table for membership |
| RLS blocks all queries | Test with service role key to isolate RLS issues vs app-level auth |
| Can't find valid UUIDs to test | Check browser network tab for UUIDs in Server Action responses, or query `accounts` table |
| Rate limited on chat endpoint | Add delays between `/api/chat` requests, test during off-peak |
| Can't verify impact | Create unique data in victim account, compare response data fields |
| Storage URLs seem public | Check Supabase Storage bucket policies — `invoices` bucket should NOT be public |

## Related Skills

- `security-threat-model` — Map trust boundaries and attack paths
- `security-best-practices` — Next.js/React security review
- `api-security-best-practices` — API auth, validation, rate limiting
- `xss-html-injection` — Client-side injection testing
