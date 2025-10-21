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
 * Get transaction stats for dashboard
 */
export async function getTransactionStats(accountId: string): Promise<TApiResponse<{
  totalSpent: number
  averageTransaction: number
  transactionCount: number
  categoryBreakdown: { category: string; total: number; count: number; percentage: number }[]
}>> {
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

    // Type assertion
    const transactionList = (transactions || []) as TTransaction[]

    const totalSpent = transactionList.reduce((sum, t) => sum + Number(t.amount), 0)
    const averageTransaction = transactionList.length > 0 ? totalSpent / transactionList.length : 0

    // Category breakdown
    const categoryMap = new Map<string, { total: number; count: number }>()
    transactionList.forEach(t => {
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
      percentage: totalSpent > 0 ? (stats.total / totalSpent) * 100 : 0,
    }))

    return {
      data: {
        totalSpent,
        averageTransaction,
        transactionCount: transactionList.length,
        categoryBreakdown,
      },
      error: null,
      success: true,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas',
      success: false,
    }
  }
}

/**
 * Get dashboard stats (complete)
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

    // Type assertion
    const transactionList = (transactions || []) as TTransaction[]

    const totalAmount = transactionList.reduce((sum, t) => sum + Number(t.amount), 0)
    const averageAmount = transactionList.length > 0 ? totalAmount / transactionList.length : 0

    const largestTransaction = transactionList.length > 0
      ? transactionList.reduce((max, t) => (Number(t.amount) > Number(max.amount) ? t : max))
      : null

    // Category breakdown
    const categoryMap = new Map<string, { total: number; count: number }>()
    transactionList.forEach(t => {
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

    const currentMonthTransactions = transactionList.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const lastMonthTransactions = transactionList.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
    })

    const currentMonthTotal = currentMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const lastMonthTotal = lastMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

    const percentageChange = lastMonthTotal > 0
      ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0

    const stats: TDashboardStats = {
      totalTransactions: transactionList.length,
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

    // Type workaround for Supabase generated types
    const { data, error } = await (supabase
      .from('transactions') as any)
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
