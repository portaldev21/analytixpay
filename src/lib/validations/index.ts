import { z } from 'zod'

// =====================================================
// AUTH VALIDATIONS
// =====================================================

export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  password: z.string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha muito longa'),
})

export const signupSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  password: z.string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha muito longa'),
  confirmPassword: z.string()
    .min(1, 'Confirmação de senha é obrigatória'),
  fullName: z.string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome muito longo')
    .optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
})

export type TLoginForm = z.infer<typeof loginSchema>
export type TSignupForm = z.infer<typeof signupSchema>

// =====================================================
// ACCOUNT VALIDATIONS
// =====================================================

export const createAccountSchema = z.object({
  name: z.string()
    .min(2, 'Nome da conta deve ter no mínimo 2 caracteres')
    .max(50, 'Nome muito longo'),
})

export const updateAccountSchema = z.object({
  name: z.string()
    .min(2, 'Nome da conta deve ter no mínimo 2 caracteres')
    .max(50, 'Nome muito longo'),
})

export const addMemberSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  role: z.enum(['owner', 'member'], {
    errorMap: () => ({ message: 'Role inválida' })
  }).default('member'),
})

export type TCreateAccountForm = z.infer<typeof createAccountSchema>
export type TUpdateAccountForm = z.infer<typeof updateAccountSchema>
export type TAddMemberForm = z.infer<typeof addMemberSchema>

// =====================================================
// INVOICE VALIDATIONS
// =====================================================

export const uploadInvoiceSchema = z.object({
  file: z.instanceof(File, { message: 'Arquivo é obrigatório' })
    .refine((file) => file.type === 'application/pdf', {
      message: 'Apenas arquivos PDF são permitidos'
    })
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: 'Arquivo deve ter no máximo 10MB'
    }),
  accountId: z.string()
    .uuid('ID da conta inválido'),
  period: z.string()
    .regex(/^\d{2}\/\d{4}$/, 'Período deve estar no formato MM/YYYY')
    .optional(),
  cardLastDigits: z.string()
    .regex(/^\d{4}$/, 'Últimos 4 dígitos do cartão devem ser numéricos')
    .optional(),
})

export const updateInvoiceSchema = z.object({
  period: z.string()
    .regex(/^\d{2}\/\d{4}$/, 'Período deve estar no formato MM/YYYY')
    .optional(),
  cardLastDigits: z.string()
    .regex(/^\d{4}$/, 'Últimos 4 dígitos do cartão devem ser numéricos')
    .optional(),
  status: z.enum(['processing', 'completed', 'error'])
    .optional(),
})

export type TUploadInvoiceForm = z.infer<typeof uploadInvoiceSchema>
export type TUpdateInvoiceForm = z.infer<typeof updateInvoiceSchema>

// =====================================================
// TRANSACTION VALIDATIONS
// =====================================================

export const createTransactionSchema = z.object({
  invoiceId: z.string()
    .uuid('ID da fatura inválido'),
  accountId: z.string()
    .uuid('ID da conta inválido'),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine((date) => {
      const d = new Date(date)
      return d instanceof Date && !isNaN(d.getTime())
    }, 'Data inválida'),
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(200, 'Descrição muito longa'),
  category: z.string()
    .min(1, 'Categoria é obrigatória')
    .default('Outros'),
  amount: z.number()
    .positive('Valor deve ser positivo')
    .max(1000000, 'Valor muito alto'),
  installment: z.string()
    .regex(/^\d+\/\d+$/, 'Parcela deve estar no formato X/Y')
    .optional(),
  isInternational: z.boolean()
    .default(false),
})

export const updateTransactionSchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(200, 'Descrição muito longa')
    .optional(),
  category: z.string()
    .min(1, 'Categoria é obrigatória')
    .optional(),
  amount: z.number()
    .positive('Valor deve ser positivo')
    .max(1000000, 'Valor muito alto')
    .optional(),
  installment: z.string()
    .regex(/^\d+\/\d+$/, 'Parcela deve estar no formato X/Y')
    .optional(),
  isInternational: z.boolean()
    .optional(),
})

export const transactionFiltersSchema = z.object({
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  category: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  search: z.string().optional(),
  invoiceId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
})

export type TCreateTransactionForm = z.infer<typeof createTransactionSchema>
export type TUpdateTransactionForm = z.infer<typeof updateTransactionSchema>
export type TTransactionFilters = z.infer<typeof transactionFiltersSchema>

// =====================================================
// PROFILE VALIDATIONS
// =====================================================

export const updateProfileSchema = z.object({
  fullName: z.string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome muito longo')
    .optional(),
  avatarUrl: z.string()
    .url('URL inválida')
    .optional(),
})

export type TUpdateProfileForm = z.infer<typeof updateProfileSchema>

// =====================================================
// COMMON VALIDATIONS
// =====================================================

export const paginationSchema = z.object({
  page: z.number()
    .int('Página deve ser um número inteiro')
    .positive('Página deve ser positiva')
    .default(1),
  limit: z.number()
    .int('Limite deve ser um número inteiro')
    .positive('Limite deve ser positivo')
    .max(100, 'Limite máximo é 100')
    .default(10),
})

export const uuidSchema = z.string().uuid('ID inválido')

export type TPagination = z.infer<typeof paginationSchema>
