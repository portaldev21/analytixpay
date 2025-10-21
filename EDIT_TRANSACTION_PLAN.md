# Edit Transaction Feature - Implementation Plan

## Overview
Implement inline transaction editing functionality using Dialog component for better UX.

## Current State Analysis

### Existing Components
- `TransactionsTable.tsx` - Displays transaction cards
- `CategoryBadge.tsx` - Shows category with styling
- `transaction.actions.ts` - Contains `updateTransaction` and `deleteTransaction` actions

### Existing Types
```typescript
TEditTransactionForm {
  date: string
  description: string
  category: string
  amount: number
  installment?: string
  is_international: boolean
}
```

## Implementation Steps

### 1. Improve Server Action (transaction.actions.ts)
**File:** `src/actions/transaction.actions.ts`

**Changes:**
- Add access validation to `updateTransaction`
- Verify user has access to the account before updating
- Add proper error handling for unauthorized access

**Code:**
```typescript
export async function updateTransaction(
  transactionId: string,
  accountId: string, // NEW PARAMETER
  updates: Partial<TTransaction>
): Promise<TApiResponse<TTransaction>> {
  try {
    const supabase = await createClient()

    // Validate access
    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: 'Acesso negado', success: false }
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
      .eq('account_id', accountId) // Ensure transaction belongs to account
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    revalidatePath('/transactions')
    revalidatePath('/dashboard')

    return { data, error: null, success: true }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao atualizar transação',
      success: false,
    }
  }
}
```

### 2. Create EditTransactionDialog Component
**File:** `src/components/transactions/EditTransactionDialog.tsx`

**Features:**
- Dialog with form fields
- Form validation with Zod
- Loading states during save
- Toast notifications for success/error
- Delete transaction option
- Category selector with all available categories

**Fields:**
- Date (date picker)
- Description (text input)
- Amount (currency input)
- Category (select with badge preview)
- Installment (optional text)
- Is International (checkbox)

**Actions:**
- Cancel (close dialog)
- Save (update transaction)
- Delete (with confirmation)

### 3. Update TransactionsTable Component
**File:** `src/components/transactions/TransactionsTable.tsx`

**Changes:**
- Add edit button (pencil icon) to each transaction card
- Import and render `EditTransactionDialog`
- Manage dialog open/close state
- Pass transaction data to dialog

**UI Layout:**
```
[Transaction Card]
  [Description | Category Badge | Installment Badge]
  [Date]
  [Amount] [Edit Button]
```

### 4. Categories Support
**Implementation:**
- Get available categories from database
- Display in select dropdown
- Show current category badge in form
- Allow changing category

**Categories list:**
- Alimentação
- Transporte
- Saúde
- Lazer
- Compras
- Educação
- Casa
- Serviços
- Outros

## UI/UX Design

### Dialog Layout
```
┌─────────────────────────────────────┐
│ Editar Transação               [×]  │
├─────────────────────────────────────┤
│                                     │
│ Descrição                           │
│ [________________________]          │
│                                     │
│ Data                    Valor       │
│ [DD/MM/YYYY]           [R$ 0,00]    │
│                                     │
│ Categoria                           │
│ [Alimentação ▼] [Badge Preview]     │
│                                     │
│ Parcela (opcional)                  │
│ [1/12___________________]           │
│                                     │
│ ☐ Transação Internacional          │
│                                     │
├─────────────────────────────────────┤
│              [Deletar] [Cancelar] [Salvar] │
└─────────────────────────────────────┘
```

### Interaction Flow
1. User clicks edit icon on transaction
2. Dialog opens with pre-filled form
3. User modifies fields
4. User clicks "Salvar"
5. Loading state shows
6. Server action updates transaction
7. Success toast appears
8. Dialog closes
9. Table refreshes with new data

### Error Handling
- Network errors → Toast with retry option
- Validation errors → Inline field errors
- Permission errors → Toast with error message
- Delete confirmation → Alert dialog

## Technical Considerations

### Form Validation (Zod)
```typescript
const editTransactionSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  installment: z.string().optional(),
  is_international: z.boolean(),
})
```

### Dependencies
- `@radix-ui/react-dialog` - Dialog component
- `react-hook-form` - Form management
- `zod` - Validation
- `sonner` - Toast notifications
- `lucide-react` - Icons (Pencil, Trash)

### Performance
- Optimistic UI updates
- Debounced save (if needed)
- Revalidate only affected paths

## Testing Checklist

### Functional Tests
- [ ] Edit transaction updates correctly
- [ ] Validation works for all fields
- [ ] Delete transaction removes from list
- [ ] Cancel closes without saving
- [ ] Access control prevents unauthorized edits
- [ ] Toast messages appear correctly

### UI Tests
- [ ] Dialog opens/closes smoothly
- [ ] Form is pre-filled with transaction data
- [ ] Category selector shows all options
- [ ] Amount input formats currency correctly
- [ ] Date picker works properly
- [ ] Mobile responsive layout

### Edge Cases
- [ ] Editing with invalid data shows errors
- [ ] Network failure shows error message
- [ ] Concurrent edits handled gracefully
- [ ] Long descriptions don't break layout
- [ ] International transactions display correctly

## Security Considerations

1. **Access Control**
   - Verify user belongs to account
   - Check transaction belongs to account
   - Validate on server, not just client

2. **Data Validation**
   - Sanitize all inputs
   - Validate amount ranges
   - Check date formats

3. **RLS Policies**
   - Database RLS enforces account isolation
   - Server actions add additional layer

## Future Enhancements

- Bulk edit multiple transactions
- Edit history/audit log
- Undo/redo functionality
- Keyboard shortcuts (Ctrl+E to edit)
- Drag-and-drop to change category
- Smart category suggestions based on description
