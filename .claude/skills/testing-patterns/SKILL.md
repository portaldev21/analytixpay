---
name: testing-patterns
description: Vitest testing patterns, factory functions, mocking strategies, and TDD workflow for ControleFatura. Use when writing unit tests, creating test factories, or following TDD red-green-refactor cycle.
---

# Testing Patterns and Utilities

## Test Framework

ControleFatura uses **Vitest** (NOT Jest) with the following configuration:

- **Environment:** jsdom (configured in `vitest.config.ts`)
- **Globals:** enabled (`globals: true`) -- `describe`, `it`, `expect`, `vi`, `beforeEach` are available globally
- **Setup file:** `vitest.setup.ts` -- runs cleanup and sets mock env vars
- **Path alias:** `@/*` resolves to `src/*`
- **Test location:** co-located `__tests__/` folders (e.g., `src/lib/analytics/__tests__/stats.test.ts`)
- **DOM assertions:** `@testing-library/jest-dom/vitest` (provides `toBeInTheDocument`, etc.)
- **Component testing:** `@testing-library/react` (web, NOT react-native)

## Testing Philosophy

**Test-Driven Development (TDD):**
- Write failing test FIRST
- Implement minimal code to pass
- Refactor after green
- Never write production code without a failing test

**Behavior-Driven Testing:**
- Test behavior, not implementation
- Focus on public APIs and business requirements
- Avoid testing implementation details
- Use descriptive test names that describe behavior

**Factory Pattern:**
- Create `getMockX(overrides?: Partial<X>)` functions using types from `@/db/types`
- Provide sensible defaults matching the database schema
- Allow overriding specific properties
- Keep tests DRY and maintainable

## Running Tests

```bash
# Run all tests
npm run test

# Run with coverage report
npm run test:coverage

# Run a single test file
npx vitest src/lib/analytics/__tests__/stats.test.ts

# Run tests in watch mode
npx vitest --watch
```

## Test File Structure

Since `globals: true` is enabled, imports from `vitest` are optional but recommended for explicitness:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateSomething } from '../my-module';
import type { TTransaction } from '@/db/types';

describe('calculateSomething', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle the happy path', () => {
    const result = calculateSomething([]);
    expect(result).toBe(0);
  });
});
```

## ControleFatura Factory Functions

### Transaction Factory

```typescript
import type { TTransaction } from '@/db/types';

const getMockTransaction = (overrides?: Partial<TTransaction>): TTransaction => ({
  id: 'tx-123',
  invoice_id: 'inv-456',
  account_id: 'acc-789',
  date: '2024-01-15',
  billing_date: '2024-02-05',
  description: 'MERCADO LIVRE',
  category: 'Compras',
  amount: 149.90,
  installment: '2/6',
  is_international: false,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  ...overrides,
});

// Usage
it('should identify international transactions', () => {
  const tx = getMockTransaction({ is_international: true, description: 'AMAZON.COM' });
  expect(isInternational(tx)).toBe(true);
});
```

### Invoice Factory

```typescript
import type { TInvoice } from '@/db/types';

const getMockInvoice = (overrides?: Partial<TInvoice>): TInvoice => ({
  id: 'inv-456',
  account_id: 'acc-789',
  user_id: 'user-001',
  file_url: 'https://test.supabase.co/storage/v1/invoices/test.pdf',
  file_name: 'fatura-janeiro-2024.pdf',
  period: '2024-01',
  card_last_digits: '1234',
  total_amount: 2500.00,
  billing_date: '2024-02-05',
  status: 'completed',
  error_message: null,
  created_at: '2024-01-20T10:00:00Z',
  updated_at: '2024-01-20T10:00:00Z',
  ...overrides,
});
```

### Account Factory

```typescript
import type { TAccount } from '@/db/types';

const getMockAccount = (overrides?: Partial<TAccount>): TAccount => ({
  id: 'acc-789',
  name: 'Minha Conta Principal',
  owner_id: 'user-001',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});
```

### Budget Config Factory

```typescript
import type { TBudgetConfig } from '@/db/types';

const getMockBudgetConfig = (overrides?: Partial<TBudgetConfig>): TBudgetConfig => ({
  id: 'cfg-001',
  account_id: 'acc-789',
  daily_base: 100,
  week_start_day: 1, // Monday
  carry_over_mode: 'carry_deficit',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});
```

### Using Partial Types (Lightweight Pattern)

For pure calculation functions that only need a subset of fields, the codebase uses `Partial<T>` with type assertions. This is the established pattern in existing tests:

```typescript
import type { TTransaction } from '@/db/types';

it('should calculate total spent correctly', () => {
  const transactions: Partial<TTransaction>[] = [
    { amount: 100, category: 'Alimentacao', date: '2025-01-01' },
    { amount: 50, category: 'Transporte', date: '2025-01-02' },
  ];

  const result = calculateTransactionStats(transactions as TTransaction[]);
  expect(result.totalSpent).toBe(150);
});
```

## Test Utilities

### Custom Render Function

For component tests, create a custom render wrapping required providers:

```typescript
// src/test/utils.tsx
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

// Add project-specific providers here (e.g., ThemeProvider, QueryClientProvider)
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return render(ui, { wrapper: AllProviders, ...options });
};

export * from '@testing-library/react';
```

**Usage:**
```typescript
import { renderWithProviders, screen } from '@/test/utils';

it('should render component', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Component Props Factory

```typescript
import type { ComponentProps } from 'react';

const getMockMyComponentProps = (
  overrides?: Partial<ComponentProps<typeof MyComponent>>,
) => ({
  title: 'Default Title',
  count: 0,
  onClick: vi.fn(),
  isLoading: false,
  ...overrides,
});

// Usage in tests
it('should render with custom title', () => {
  const props = getMockMyComponentProps({ title: 'Custom Title' });
  renderWithProviders(<MyComponent {...props} />);
  expect(screen.getByText('Custom Title')).toBeInTheDocument();
});
```

## Mocking Patterns

### Mocking Modules

```typescript
// Mock entire module
vi.mock('@/lib/supabase/server');

// Mock with factory function
vi.mock('@/lib/analytics', () => ({
  calculateTransactionStats: vi.fn(),
}));

// Access mocked module
import { calculateTransactionStats } from '@/lib/analytics';
const mockedStats = vi.mocked(calculateTransactionStats);

// In test
mockedStats.mockReturnValue({
  totalSpent: 500,
  transactionCount: 10,
  averageTransaction: 50,
  categoryBreakdown: [],
});
```

### Mocking Supabase Client

```typescript
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
  requireAuth: vi.fn().mockResolvedValue({
    user: { id: 'user-001' },
    supabase: {},
  }),
  requireAccountAccess: vi.fn().mockResolvedValue({
    user: { id: 'user-001' },
    supabase: {},
    accountId: 'acc-789',
  }),
}));
```

### Mocking Server Actions

```typescript
vi.mock('@/actions/invoice.actions', () => ({
  getInvoices: vi.fn().mockResolvedValue({
    data: [],
    error: null,
    success: true,
  }),
}));
```

### Mocking Next.js APIs

```typescript
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/dashboard'),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
```

## Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render component with default props', () => {});
    it('should render loading state when loading', () => {});
  });

  describe('User interactions', () => {
    it('should call onClick when button is clicked', async () => {});
  });

  describe('Edge cases', () => {
    it('should handle empty data gracefully', () => {});
  });
});
```

## Query Patterns

```typescript
import { screen, waitFor } from '@testing-library/react';

// Element must exist
expect(screen.getByText('Hello')).toBeInTheDocument();

// Element should not exist
expect(screen.queryByText('Goodbye')).not.toBeInTheDocument();

// Element appears asynchronously
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Find element (returns Promise, auto-waits)
const element = await screen.findByText('Loaded');
expect(element).toBeInTheDocument();
```

## User Interaction Patterns

```typescript
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should submit form on button click', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  renderWithProviders(<LoginForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText('Email'), 'user@example.com');
  await user.type(screen.getByLabelText('Password'), 'password123');
  await user.click(screen.getByRole('button', { name: /entrar/i }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalled();
  });
});
```

### fireEvent (lower-level alternative)

```typescript
import { fireEvent, screen } from '@testing-library/react';

it('should update input value', () => {
  renderWithProviders(<SearchInput />);

  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'MERCADO LIVRE' },
  });

  expect(screen.getByRole('textbox')).toHaveValue('MERCADO LIVRE');
});

it('should handle button click', () => {
  const onClick = vi.fn();
  renderWithProviders(<button onClick={onClick}>Salvar</button>);

  fireEvent.click(screen.getByText('Salvar'));
  expect(onClick).toHaveBeenCalledOnce();
});
```

## Async Testing Patterns

### Testing Server Actions

```typescript
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase/server');

describe('getInvoices', () => {
  it('should return invoices for account', async () => {
    const { requireAccountAccess } = await import('@/lib/supabase/server');
    vi.mocked(requireAccountAccess).mockResolvedValue({
      user: { id: 'user-001' },
      supabase: mockSupabase,
      accountId: 'acc-789',
    });

    const result = await getInvoices('acc-789');
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });
});
```

### Testing API Responses (TApiResponse)

```typescript
import type { TApiResponse } from '@/db/types';

it('should return error response on failure', async () => {
  const result: TApiResponse<null> = await failingAction();

  expect(result).toEqual({
    data: null,
    error: expect.stringContaining('failed'),
    success: false,
  });
});
```

## Anti-Patterns to Avoid

### Testing Mock Behavior Instead of Real Behavior

```typescript
// Bad - testing the mock
expect(mockFetchData).toHaveBeenCalled();

// Good - testing actual behavior
expect(screen.getByText('John Doe')).toBeInTheDocument();
```

### Not Using Factories

```typescript
// Bad - duplicated, inconsistent test data
it('test 1', () => {
  const tx = { id: '1', amount: 100, description: 'Test', category: 'Outros' };
});
it('test 2', () => {
  const tx = { id: '2', amount: 50, description: 'Test' }; // Missing fields!
});

// Good - reusable factory with proper types
const tx = getMockTransaction({ amount: 50 });
```

### Using Jest APIs Instead of Vitest

```typescript
// Bad - Jest API (will not work)
jest.fn();
jest.mock('...');
jest.clearAllMocks();

// Good - Vitest API
vi.fn();
vi.mock('...');
vi.clearAllMocks();
```

### Using React Native Testing Library

```typescript
// Bad - wrong library for web project
import { render } from '@testing-library/react-native';
import { fireEvent } from '@testing-library/react-native';
fireEvent.press(button);
fireEvent.changeText(input, 'value');

// Good - web testing library
import { render, fireEvent } from '@testing-library/react';
fireEvent.click(button);
fireEvent.change(input, { target: { value: 'value' } });
```

## Best Practices

1. **Always use factory functions** for props and data, based on `@/db/types`
2. **Test behavior, not implementation** -- assert on rendered output, not internals
3. **Use descriptive test names** that describe expected behavior in plain language
4. **Organize with describe blocks** -- group by feature, state, or interaction
5. **Clear mocks between tests** with `vi.clearAllMocks()` in `beforeEach`
6. **Keep tests focused** -- one behavior per test
7. **Use `Partial<T>` for lightweight mocks** when testing pure calculation functions
8. **Prefer `userEvent` over `fireEvent`** for realistic user interaction simulation
9. **Use `toBeInTheDocument()`** instead of `toBeTruthy()` for DOM assertions
10. **Co-locate tests** in `__tests__/` folders next to the source module

## Integration with Other Skills

- **react-ui-patterns**: Test all UI states (loading, error, empty, success)
- **systematic-debugging**: Write test that reproduces bug before fixing
