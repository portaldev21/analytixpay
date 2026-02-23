---
name: abacatepay
description: "Help with AbacatePay payment integration in Next.js projects. Use when implementing PIX payments, managing subscriptions, handling webhooks, or debugging payment flows. Covers SDK usage, webhook verification, and billing management for Brazilian SaaS applications."
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

# AbacatePay Integration Helper

Assist with AbacatePay payment gateway integration for Brazilian SaaS applications.

> **ControleFatura Note:** Potential integration for ControleFatura premium features or subscription plans. AbacatePay is ideal for Brazilian PIX-based payments, which aligns well with ControleFatura's Brazilian user base.

## Quick Reference

### Installation
```bash
npm install abacatepay-nodejs-sdk
```

### Environment Variables
```bash
ABACATEPAY_API_KEY="abp_live_..."      # API key from dashboard
ABACATEPAY_WEBHOOK_SECRET="whsec_..."  # Webhook secret
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # For callback URLs
```

### SDK Initialization
```typescript
import AbacatePay from "abacatepay-nodejs-sdk";
const abacate = AbacatePay(process.env.ABACATEPAY_API_KEY!);
```

## Common Tasks

### 1. Create a PIX Payment (Server Action Pattern)

Using ControleFatura's Server Action pattern with `requireAuth()`:

```typescript
// src/actions/billing.actions.ts
"use server";

import { requireAuth } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { TApiResponse } from "@/db/types";
import AbacatePay from "abacatepay-nodejs-sdk";

const abacate = AbacatePay(process.env.ABACATEPAY_API_KEY!);

export async function createPixPayment(
  planId: string
): Promise<TApiResponse<{ url: string }>> {
  try {
    const { user, supabase } = await requireAuth();

    // Get user profile for payment
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return { data: null, error: "Profile not found", success: false };
    }

    const response = await abacate.billing.create({
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [{
        externalId: planId,
        name: "ControleFatura Pro",
        quantity: 1,
        price: 2990, // R$ 29,90 in centavos
      }],
      customer: {
        email: profile.email,
        name: profile.full_name || "Usuario",
      },
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
      completionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings?checkout=success`,
    });

    return { data: { url: response.data.url }, error: null, success: true };
  } catch (error) {
    logger.error("Failed to create PIX payment", error);
    return { data: null, error: "Failed to create payment", success: false };
  }
}
```

### 2. Create PIX QR Code (Direct)

```typescript
const response = await abacate.pixQrCode.create({
  amount: 2990, // R$ 29,90
  expiresIn: 3600, // 1 hour
  description: "Payment description",
});

// response.data: { id, brCode, brCodeBase64, status, expiresAt }
```

### 3. Check Payment Status

```typescript
const response = await abacate.pixQrCode.check({ id: "pix_abc123" });
// response.data.status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED"
```

### 4. Simulate Payment (Dev Mode)

```typescript
await abacate.pixQrCode.simulatePayment({ id: "pix_abc123" });
```

## Webhook Handling

### Signature Verification (HMAC-SHA256)

```typescript
import crypto from "crypto";

function validateSignature(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

### Webhook API Route (ControleFatura Pattern)

```typescript
// src/app/api/abacatepay/webhook/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import crypto from "crypto";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-abacate-signature")!;

  // Verify webhook signature
  const expected = crypto
    .createHmac("sha256", process.env.ABACATEPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    logger.error("Invalid AbacatePay webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(body);
  const supabase = await createClient();

  switch (payload.event) {
    case "billing.paid":
      // Handle payment confirmation
      logger.info("Payment confirmed", { billingId: payload.data.billing?.id });
      break;
  }

  return NextResponse.json({ received: true });
}
```

### Webhook Events

| Event | Description |
|-------|-------------|
| `billing.paid` | Payment confirmed via PIX |
| `withdraw.done` | Withdrawal completed |
| `withdraw.failed` | Withdrawal failed |

### Webhook Payload Structure

```typescript
interface WebhookPayload {
  id: string;              // Event ID (use for idempotency)
  event: string;           // Event type
  devMode: boolean;        // True if test environment
  data: {
    billing?: {
      id: string;
      amount: number;
      status: string;
    };
  };
}
```

## Pricing

| Method | Fee |
|--------|-----|
| PIX | R$ 0,80 flat per transaction |
| Credit Card | 3.5% + R$ 0,60 |
| Withdrawal | R$ 0,80 (up to 20/month) |

## Database Schema Overview

### Plans Table
- `id`: Plan identifier (e.g., "pro-monthly")
- `priceInCents`: Price in centavos (R$ 29,90 = 2990)
- `interval`: "monthly" | "yearly" | "lifetime"
- `limits`: JSONB with feature limits
- `features`: JSONB array of display features

### Subscriptions Table
- `userId`: One subscription per user (unique)
- `planId`: Current plan
- `status`: "active" | "cancelled" | "expired"
- `currentPeriodStart/End`: Subscription validity

### Payments Table
- `abacateBillingId`: AbacatePay billing ID
- `status`: "pending" | "paid" | "expired"
- `paidAt`: Payment confirmation timestamp

## Common Patterns

See [references/integration-patterns.md](references/integration-patterns.md) for:
- Subscription management
- Idempotent webhook handling
- Feature gating
- Error handling

## API Reference

See [references/api-reference.md](references/api-reference.md) for complete endpoint documentation.

## Testing Checklist

- [ ] Environment variables configured
- [ ] SDK connects successfully
- [ ] Checkout creates billing and returns URL
- [ ] Webhook receives events (use AbacatePay dashboard)
- [ ] Payment status updates correctly
- [ ] Subscription created after payment
- [ ] Idempotency prevents duplicates
