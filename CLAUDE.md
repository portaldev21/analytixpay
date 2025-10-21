# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AnalytiXPay is a credit card invoice management system built with Next.js 15 and Supabase. It features automatic PDF parsing, transaction extraction, and categorization with multi-user account support.

**Stack:** Next.js 15 (App Router) + TypeScript 5 + Supabase + Tailwind CSS 4 + Biome

## Common Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack
npm run start        # Run production build
```

### Code Quality
```bash
npm run lint         # Run Biome linter
npm run format       # Format code with Biome
```

### Setup
```bash
npm install                        # Install dependencies
node scripts/setup-supabase.js     # Interactive Supabase setup
```

**IMPORTANT:** Never start the server automatically. Always ask the user to start it and test.

## Architecture

### App Router Structure

The project uses Next.js 15 App Router with route groups:

- `(auth)/` - Public authentication routes (login, signup)
- `(dashboard)/` - Protected routes requiring authentication
- Middleware handles session management and route protection

### Data Flow Pattern

1. **UI Components** (Client Components in `src/components/`) handle user interaction
2. **Server Actions** (`src/actions/*.ts`) process requests with `'use server'` directive
3. **Supabase Helpers** (`src/lib/supabase/`) manage database access
4. **Database** enforces Row Level Security (RLS) policies

### Supabase Client Pattern

The codebase uses **two separate Supabase clients**:

- `src/lib/supabase/client.ts` - Browser client for Client Components (`'use client'`)
- `src/lib/supabase/server.ts` - Server client for Server Components and Server Actions

**Critical:** Always import the correct client based on context. Server Actions and Server Components MUST use `createClient()` from `server.ts`.

### Server Actions Architecture

All data mutations use Server Actions with consistent patterns:

- Located in `src/actions/*.actions.ts`
- Return type: `TApiResponse<T>` with `{ data, error, success }`
- Always call `revalidatePath()` after mutations
- Validate access with `hasAccessToAccount()` before operations
- Handle errors with try-catch and return structured responses

Example pattern:
```typescript
'use server'

export async function actionName(params): Promise<TApiResponse<ReturnType>> {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    // Validate access
    if (!user) return { data: null, error: 'Not authenticated', success: false }
    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: 'Access denied', success: false }
    }

    // Perform operation
    const { data, error } = await supabase.from('table').select()

    if (error) return { data: null, error: error.message, success: false }

    revalidatePath('/relevant-path')
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: error.message, success: false }
  }
}
```

### PDF Parsing System

PDF processing uses a **hybrid AI + regex approach** for universal invoice parsing:

**AI Parser** (`src/lib/pdf/ai-parser.ts`):
- Uses OpenAI GPT-4o-mini for intelligent data extraction
- Works with **any bank format** (Inter, Nubank, Itaú, Bradesco, etc.)
- Extracts structured JSON with transactions, dates, amounts, installments
- Auto-categorizes transactions intelligently
- Cost: ~$0.01-0.03 per invoice (~3000-5000 tokens)
- Returns `TPdfParseResult` with parsed data

**Regex Parser** (`src/lib/pdf/parser.ts` - fallback):
- Pattern-based extraction for common Brazilian formats
- Supports multiple date/amount patterns
- Keyword-based categorization
- Used as fallback if AI parsing fails or is disabled

**Main Parser** (`parsePdfFile` in `src/lib/pdf/parser.ts`):
- Uses `pdf2json` to extract raw text from PDF
- Tries AI parsing first (if `OPENAI_API_KEY` is configured)
- Falls back to regex patterns if AI fails
- Handles Brazilian currency (R$ 1.234,56) and dates (DD/MM/YYYY, "DD de MÊS YYYY")

**Configuration:**
- Set `OPENAI_API_KEY` in `.env.local` for AI parsing (see `OPENAI_SETUP.md`)
- Can disable AI via options: `parsePdfFile(buffer, { useAI: false })`
- Debug mode available: `parsePdfFile(buffer, { debug: true })`

### Authentication & Access Control

- Email/password + Google OAuth via Supabase Auth
- Middleware in `src/middleware.ts` validates sessions on all routes
- Multi-tenant architecture: users can belong to multiple accounts
- Role-based access: `owner` (full control) vs `member` (limited access)
- All database queries filtered by RLS policies

**Access checks:**
- `getCurrentUser()` - Get authenticated user
- `hasAccessToAccount(accountId)` - Check account membership
- `isAccountOwner(accountId)` - Check owner privileges

### Database Schema

Main tables:
- `accounts` - Shared payment accounts
- `account_members` - User-account relationships with roles
- `invoices` - Uploaded PDFs with metadata
- `transactions` - Extracted line items from invoices
- `categories` - Spending categories (auto-assigned)
- `profiles` - User profile data

**Important:** All tables have RLS enabled. Server-side access checks complement database policies.

### Type System

All types in `src/db/types.ts`:
- Database types match Supabase schema exactly
- Separate types for Row/Insert/Update operations
- Extended types for joins (e.g., `TInvoiceWithTransactions`)
- Form validation types for client-side
- API response wrapper: `TApiResponse<T>`

**Type naming:** Prefix with `T` (e.g., `TAccount`, `TTransaction`)

### Component Architecture

- Use functional components (avoid classes unless absolutely necessary)
- Shadcn UI components in `src/components/ui/`
- Feature-specific components organized by route
- Shared components in `src/components/shared/`
- Client Components marked with `'use client'` directive

### Styling

- Tailwind CSS 4 with custom configuration
- Dark mode by default (design system uses blue #3b82f6 + dark gray)
- Utility-first approach with `cn()` helper from `src/lib/utils.ts`
- Responsive mobile-first design
- Animations via Framer Motion

## Development Guidelines

### Code Style

- **Linting:** Biome enforces code standards (not ESLint/Prettier)
- **Formatting:** 2-space indentation, organized imports
- **Functions over classes:** Prefer functional programming patterns
- **TypeScript:** Strict mode enabled, no `any` types

### Commit Messages

- Always write commit messages in **English**
- Follow conventional commits format
- After completing changes, always provide commit message text
- Never execute `git` commands without explicit permission

### File Organization

- Import alias `@/*` maps to `src/*`
- Keep related functionality grouped by feature
- Server Actions separate from component logic
- Types centralized in `db/types.ts`

### Security

- Never commit `.env.local` or sensitive credentials
- Always validate user access in Server Actions
- Use RLS policies as the last line of defense
- Sanitize file uploads and user input

### Testing & Quality

When making changes:
1. Verify TypeScript compilation (`npm run build`)
2. Run linter (`npm run lint`)
3. Test in browser (ask user to start dev server)
4. Validate database operations in Supabase dashboard

## Project-Specific Notes

### PDF Upload Flow

1. User drops PDF in upload component
2. File validated client-side (type, size)
3. Server Action uploads to Supabase Storage (`invoices` bucket)
4. PDF parsed with `parsePdfFile()`
5. Invoice record created with metadata
6. Transactions batch-inserted
7. Paths revalidated for cache refresh

### Invoice Processing

- Files stored in Storage bucket under `{accountId}/{timestamp}.pdf`
- Parser returns structured data or error message
- Failed uploads clean up Storage files
- Status tracking: `processing` → `completed` | `error`

### Category System

Auto-categorization uses keyword matching against Brazilian merchant patterns:
- Keywords defined in `CATEGORY_KEYWORDS` constant
- Falls back to "Outros" (Other) if no match
- Categories include: Alimentação, Transporte, Saúde, Lazer, etc.

### Multi-Account Architecture

- Users create/join accounts via `account_members` table
- Each account isolated by RLS policies
- Owners can manage members, members can only view
- All transactions scoped to account_id

## Environment Variables

Required in `.env.local`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (if needed)

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OpenAI (optional - for AI-powered PDF parsing)
OPENAI_API_KEY=sk-proj-... (see OPENAI_SETUP.md)
```

## Documentation References

Additional documentation in repository:
- `QUICKSTART.md` - 5-minute setup guide
- `PROJECT_DOCUMENTATION.md` - Complete architecture
- `SETUP_GUIDE.md` - Detailed setup instructions
- `README.md` - Project overview and features
- `OPENAI_SETUP.md` - OpenAI API configuration for AI parsing
- `DEBUG_PDF_PARSER.md` - Debugging guide for PDF parsing issues
