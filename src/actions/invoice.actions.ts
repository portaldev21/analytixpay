'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getCurrentUser, hasAccessToAccount } from '@/lib/supabase/server'
import { parsePdfFile } from '@/lib/pdf/parser'
import { uploadLimiter } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import type { TApiResponse, TInvoice, TInvoiceWithTransactions } from '@/db/types'

/**
 * Upload and process invoice PDF
 */
export async function uploadInvoice(
  formData: FormData
): Promise<TApiResponse<{ invoice: TInvoice; transactionsCount: number }>> {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      logger.warn('Upload attempt without authentication')
      return { data: null, error: 'Usuário não autenticado', success: false }
    }

    // Rate limiting: 5 uploads per 10 minutes
    try {
      await uploadLimiter.check(5, user.id)
    } catch (error) {
      logger.warn('Upload rate limit exceeded', { userId: user.id })
      return {
        data: null,
        error: 'Limite de uploads excedido. Aguarde alguns minutos e tente novamente.',
        success: false,
      }
    }

    const file = formData.get('file') as File
    const accountId = formData.get('accountId') as string

    if (!file || !accountId) {
      logger.warn('Upload missing required fields', { userId: user.id, hasFile: !!file, hasAccountId: !!accountId })
      return { data: null, error: 'Arquivo e conta são obrigatórios', success: false }
    }

    logger.info('Starting invoice upload', {
      userId: user.id,
      accountId,
      fileName: file.name,
      fileSize: file.size,
    })

    // Check access
    if (!(await hasAccessToAccount(accountId))) {
      logger.warn('Upload access denied', { userId: user.id, accountId })
      return { data: null, error: 'Acesso negado', success: false }
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${accountId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filePath, file)

    if (uploadError) {
      return { data: null, error: uploadError.message, success: false }
    }

    const { data: { publicUrl } } = supabase.storage.from('invoices').getPublicUrl(filePath)

    // Parse PDF with AI (with regex fallback)
    const buffer = await file.arrayBuffer()
    const parseResult = await parsePdfFile(buffer, {
      useAI: true,
      fallbackToRegex: true,
      debug: false
    })

    if (parseResult.error || !parseResult.transactions.length) {
      await supabase.storage.from('invoices').remove([filePath])
      return { data: null, error: parseResult.error || 'Nenhuma transação encontrada', success: false }
    }

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        account_id: accountId,
        user_id: user.id,
        file_url: publicUrl,
        file_name: file.name,
        period: parseResult.period,
        card_last_digits: parseResult.cardLastDigits,
        total_amount: parseResult.totalAmount,
        status: 'completed',
      } as any)
      .select()
      .single()

    if (invoiceError || !invoice) {
      await supabase.storage.from('invoices').remove([filePath])
      return { data: null, error: invoiceError?.message || 'Erro ao criar fatura', success: false }
    }

    // Type assertion for invoice
    const createdInvoice = invoice as TInvoice

    // Insert transactions
    const transactions = parseResult.transactions.map(t => ({
      invoice_id: createdInvoice.id,
      account_id: accountId,
      ...t,
    }))

    const { error: transError } = await supabase.from('transactions').insert(transactions as any)

    if (transError) {
      return { data: null, error: transError.message, success: false }
    }

    revalidatePath('/invoices')
    revalidatePath('/transactions')
    revalidatePath('/dashboard')

    return {
      data: { invoice: createdInvoice, transactionsCount: transactions.length },
      error: null,
      success: true,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao processar fatura',
      success: false,
    }
  }
}

/**
 * Get invoices for account
 */
export async function getInvoices(accountId: string): Promise<TApiResponse<TInvoice[]>> {
  try {
    const supabase = await createClient()

    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: 'Acesso negado', success: false }
    }

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    return { data: data || [], error: null, success: true }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao buscar faturas',
      success: false,
    }
  }
}

/**
 * Delete invoice (and all associated transactions via CASCADE)
 */
export async function deleteInvoice(invoiceId: string, accountId: string): Promise<TApiResponse<{
  success: true
  deletedTransactions: number
}>> {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return { data: null, error: 'Usuário não autenticado', success: false }
    }

    // Check if user is owner (only owners can delete invoices)
    const { data: account } = await supabase
      .from('accounts')
      .select('owner_id')
      .eq('id', accountId)
      .single()

    if (!account || account.owner_id !== user.id) {
      return { data: null, error: 'Apenas o dono da conta pode deletar faturas', success: false }
    }

    // Get invoice details before deletion
    const { data: invoice } = await supabase
      .from('invoices')
      .select('file_url, id')
      .eq('id', invoiceId)
      .eq('account_id', accountId)
      .single()

    if (!invoice) {
      return { data: null, error: 'Fatura não encontrada', success: false }
    }

    // Count transactions before deletion
    const { count: transactionsCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('invoice_id', invoiceId)

    // Delete invoice (transactions will be deleted automatically via CASCADE)
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('account_id', accountId)

    if (deleteError) {
      return { data: null, error: deleteError.message, success: false }
    }

    // Extract file path from URL and delete from Storage
    try {
      const urlParts = invoice.file_url.split('/invoices/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1].split('?')[0] // Remove query params
        await supabase.storage.from('invoices').remove([filePath])
      }
    } catch (storageError) {
      // Log but don't fail - file might already be deleted
      console.warn('Failed to delete file from storage:', storageError)
    }

    revalidatePath('/invoices')
    revalidatePath('/transactions')
    revalidatePath('/dashboard')

    return {
      data: {
        success: true,
        deletedTransactions: transactionsCount || 0
      },
      error: null,
      success: true
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao deletar fatura',
      success: false,
    }
  }
}

/**
 * Get invoices summary for dashboard
 */
export async function getInvoicesSummary(accountId: string): Promise<TApiResponse<{
  invoiceId: string
  period: string
  cardLastDigits: string | null
  totalAmount: number
  transactionCount: number
}[]>> {
  try {
    const supabase = await createClient()

    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: 'Acesso negado', success: false }
    }

    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })

    if (invoicesError) {
      return { data: null, error: invoicesError.message, success: false }
    }

    const invoiceList = (invoices || []) as TInvoice[]

    // Get transaction count for each invoice
    const summaries = await Promise.all(
      invoiceList.map(async (invoice) => {
        const { count, error } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('invoice_id', invoice.id)

        return {
          invoiceId: invoice.id,
          period: invoice.period || 'Sem período',
          cardLastDigits: invoice.card_last_digits,
          totalAmount: Number(invoice.total_amount) || 0,
          transactionCount: count || 0,
        }
      })
    )

    return { data: summaries, error: null, success: true }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao buscar resumo de faturas',
      success: false,
    }
  }
}
