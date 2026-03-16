# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the ControleFatura (AnalytixPay) codebase.

> **Note**: For comprehensive project documentation, see the main `/CLAUDE.md` at the repository root.

## Available Slash Commands

| Command | Description |
|---------|-------------|
| `/commit` | Stage all changes and create commit with AI-generated message |
| `/push` | Push current branch to remote |
| `/pr` | Create Pull Request on GitHub |
| `/ship` | Commit + Push + PR in one command |

## Domain Skills

| Skill | When to Use |
|-------|-------------|
| `/seo-technical` | SEO for Next.js (sitemaps, meta tags, JSON-LD, Open Graph) |
| `/ux-design` | UX Design principles for styling interface |
| `/marketing-copy` | Copywriting for landing page and marketing content |
| `/favicon` | Favicon and app icon generation |
| `/abacatepay` | PIX payments, subscriptions, webhooks (AbacatePay) |
| `/cloudflare` | DNS, email routing, R2 storage setup |

## Development Skills

| Skill | When to Use |
|-------|-------------|
| `/nextjs-best-practices` | Server vs Client Components, data fetching, App Router patterns |
| `/nextjs-supabase-auth` | Supabase Auth + Next.js App Router integration |
| `/supabase-postgres-best-practices` | Query performance, RLS, connection pooling, schema design |
| `/testing-patterns` | Factory functions, mocking strategies, TDD workflow |
| `/clean-code` | SRP, DRY, KISS, guard clauses, naming conventions |
| `/performance` | Core Web Vitals, image optimization, Lighthouse scores |
| `/api-security-best-practices` | Secure API design, OWASP Top 10, rate limiting |

## PRD Workflow Skills

| Skill | When to Use |
|-------|-------------|
| `/prd` | Generate a PRD from a feature idea |
| `/prd-tasks` | Break a PRD into individual task files |
| `/ralph` | Convert PRD + tasks into prd-XX.json for execution |
| `/ralph-loop` | Implement tasks in-session from prd-XX.json |

## Security Skills

| Skill | When to Use |
|-------|-------------|
| `/security-best-practices` | Next.js + React security review (OWASP, CSP, XSS) |
| `/security-threat-model` | Threat modeling for the application |
| `/sql-injection-testing` | SQL injection vulnerability testing |
| `/broken-authentication` | Authentication vulnerability assessment |
| `/xss-html-injection` | XSS and HTML injection testing |
| `/idor-testing` | Insecure direct object reference testing |
| `/api-fuzzing-bug-bounty` | API security fuzzing |

## Specialized Agents

| Agent | Purpose |
|-------|---------|
| `security-auditor` | Security audit for APIs, Supabase RLS, auth flows |

Invoke via `Task` tool with `subagent_type: "agent-name"`

## Quick Reminders

- Use `npm` (not pnpm/yarn)
- Dev server: `http://localhost:3000`
- Run `npm run lint` and `npm run format` before commits
- `@/*` path alias resolves to `src/*`
- Stack: Next.js 15 + TypeScript 5 + Supabase + Tailwind CSS 4 + Biome
