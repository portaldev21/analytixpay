'use server'

import { revalidatePath } from 'next/cache'
import { createClient, hasAccessToAccount } from '@/lib/supabase/server'
import type { TApiResponse, TTransaction, TDashboardStats, TTransactionFilters } from '@/db/types'

/**
 * Get transactions for account
 */
export async function getTransactions(
  accountId: string,
  filters?: TTransactionFilters
): Promise<TApiResponse<TTransaction[]>> {
  try {
    const supabase = await createClient()

    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: 'Acesso negado', success: false }
    }

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.search) {
      query = query.ilike('description', `%${filters.search}%`)
    }
    if (filters?.minAmount) {
      query = query.gte('amount', filters.minAmount)
    }
    if (filters?.maxAmount) {
      query = query.lte('amount', filters.maxAmount)
    }

    query = query.order('date', { ascending: false })

    const { data, error } = await query

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    return { data: data || [], error: null, success: true }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao buscar transações',
      success: false,
    }
  }
}

/**
 * Get dashboard stats
 */
export async function getDashboardStats(accountId: string): Promise<TApiResponse<TDashboardStats>> {
  try {
    const supabase = await createClient()

    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: 'Acesso negado', success: false }
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const averageAmount = transactions.length > 0 ? totalAmount / transactions.length : 0

    const largestTransaction = transactions.length > 0
      ? transactions.reduce((max, t) => (Number(t.amount) > Number(max.amount) ? t : max))
      : null

    // Category breakdown
    const categoryMap = new Map<string, { total: number; count: number }>()
    transactions.forEach(t => {
      const existing = categoryMap.get(t.category) || { total: 0, count: 0 }
      categoryMap.set(t.category, {
        total: existing.total + Number(t.amount),
        count: existing.count + 1,
      })
    })

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      total: stats.total,
      count: stats.count,
      percentage: totalAmount > 0 ? (stats.total / totalAmount) * 100 : 0,
    }))

    // Monthly comparison
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
    })

    const currentMonthTotal = currentMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const lastMonthTotal = lastMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

    const percentageChange = lastMonthTotal > 0
      ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0

    const stats: TDashboardStats = {
      totalTransactions: transactions.length,
      totalAmount,
      averageAmount,
      largestTransaction: largestTransaction ? {
        amount: Number(largestTransaction.amount),
        description: largestTransaction.description,
        date: largestTransaction.date,
      } : null,
      categoryBreakdown,
      monthlyComparison: {
        currentMonth: currentMonthTotal,
        lastMonth: lastMonthTotal,
        percentageChange,
      },
    }

    return { data: stats, error: null, success: true }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas',
      success: false,
    }
  }
}

/**
 * Update transaction
 */
export async function updateTransaction(
  transactionId: string,
  updates: Partial<TTransaction>
): Promise<TApiResponse<TTransaction>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
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

/**
 * Delete transaction
 */
export async function deleteTransaction(transactionId: string): Promise<TApiResponse<{ success: true }>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    revalidatePath('/transactions')
    revalidatePath('/dashboard')

    return { data: { success: true }, error: null, success: true }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao deletar transação',
      success: false,
    }
  }
}
