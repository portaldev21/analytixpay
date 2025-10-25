# Dependencies to Install

To enable the edit transaction feature, install the following dependencies:

```bash
npm install sonner @radix-ui/react-checkbox
```

## What these packages do:

- **sonner**: Modern toast notification library (used for success/error messages)
- **@radix-ui/react-checkbox**: Accessible checkbox component for "International Transaction" field

## After Installation

1. Add the Toaster component to your root layout
2. Import in `src/app/layout.tsx`:

```tsx
import { Toaster } from 'sonner'

// In the layout component, add:
<Toaster position="top-right" richColors />
```

## Alternative: Use existing useToast hook

If you prefer to use the existing `useToast` hook instead of sonner, you'll need to:

1. Create a Toast container component
2. Update `EditTransactionDialog.tsx` to use the custom hook
3. Add the Toast container to the layout
