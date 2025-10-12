'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getCurrentUser, isAccountOwner } from '@/lib/supabase/server'
import { createAccountSchema, addMemberSchema } from '@/lib/validations'
import type { TApiResponse, TAccount, TAccountWithMembers } from '@/db/types'

/**
 * Get all accounts for current user
 */
export async function getUserAccounts(): Promise<TApiResponse<TAccount[]>> {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return {
        data: null,
        error: 'Usuário não autenticado',
        success: false,
      }
    }

    const { data: members, error } = await supabase
      .from('account_members')
      .select('account_id, accounts(*)')
      .eq('user_id', user.id)

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    const accounts = members
      .map(m => m.accounts)
      .filter(Boolean) as TAccount[]

    return {
      data: accounts,
      error: null,
      success: true,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao buscar contas',
      success: false,
    }
  }
}

/**
 * Get account with members
 */
export async function getAccountWithMembers(
  accountId: string
): Promise<TApiResponse<TAccountWithMembers>> {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return {
        data: null,
        error: 'Usuário não autenticado',
        success: false,
      }
    }

    // Check if user has access to this account
    const { data: membership, error: memberError } = await supabase
      .from('account_members')
      .select('id')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership) {
      return {
        data: null,
        error: 'Você não tem acesso a esta conta',
        success: false,
      }
    }

    // Get account with members
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select(`
        *,
        members:account_members(
          *,
          profile:profiles(*)
        )
      `)
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      return {
        data: null,
        error: 'Conta não encontrada',
        success: false,
      }
    }

    // Get counts
    const { count: membersCount } = await supabase
      .from('account_members')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)

    const { count: invoicesCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)

    const result: TAccountWithMembers = {
      ...account,
      members: account.members || [],
      _count: {
        members: membersCount || 0,
        invoices: invoicesCount || 0,
      },
    }

    return {
      data: result,
      error: null,
      success: true,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao buscar conta',
      success: false,
    }
  }
}

/**
 * Create new account
 */
export async function createAccount(
  name: string
): Promise<TApiResponse<TAccount>> {
  try {
    const validated = createAccountSchema.parse({ name })
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return {
        data: null,
        error: 'Usuário não autenticado',
        success: false,
      }
    }

    // Create account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        name: validated.name,
        owner_id: user.id,
      })
      .select()
      .single()

    if (accountError || !account) {
      return {
        data: null,
        error: accountError?.message || 'Erro ao criar conta',
        success: false,
      }
    }

    // Add owner as member
    const { error: memberError } = await supabase
      .from('account_members')
      .insert({
        account_id: account.id,
        user_id: user.id,
        role: 'owner',
      })

    if (memberError) {
      // Rollback account creation
      await supabase.from('accounts').delete().eq('id', account.id)
      return {
        data: null,
        error: memberError.message,
        success: false,
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/settings')

    return {
      data: account,
      error: null,
      success: true,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao criar conta',
      success: false,
    }
  }
}

/**
 * Add member to account
 */
export async function addMemberToAccount(
  accountId: string,
  email: string,
  role: 'owner' | 'member' = 'member'
): Promise<TApiResponse<{ success: true }>> {
  try {
    const validated = addMemberSchema.parse({ email, role })
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return {
        data: null,
        error: 'Usuário não autenticado',
        success: false,
      }
    }

    // Check if current user is owner
    const isOwner = await isAccountOwner(accountId)
    if (!isOwner) {
      return {
        data: null,
        error: 'Apenas o dono da conta pode adicionar membros',
        success: false,
      }
    }

    // Find user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      return {
        data: null,
        error: 'Erro ao buscar usuário',
        success: false,
      }
    }

    const targetUser = users?.find(u => u.email === validated.email)

    if (!targetUser) {
      return {
        data: null,
        error: 'Usuário não encontrado com este email',
        success: false,
      }
    }

    // Check if user is already a member
    const { data: existing } = await supabase
      .from('account_members')
      .select('id')
      .eq('account_id', accountId)
      .eq('user_id', targetUser.id)
      .single()

    if (existing) {
      return {
        data: null,
        error: 'Este usuário já é membro desta conta',
        success: false,
      }
    }

    // Add member
    const { error: memberError } = await supabase
      .from('account_members')
      .insert({
        account_id: accountId,
        user_id: targetUser.id,
        role: validated.role,
      })

    if (memberError) {
      return {
        data: null,
        error: memberError.message,
        success: false,
      }
    }

    revalidatePath(`/settings`)

    return {
      data: { success: true },
      error: null,
      success: true,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao adicionar membro',
      success: false,
    }
  }
}

/**
 * Remove member from account
 */
export async function removeMemberFromAccount(
  accountId: string,
  userId: string
): Promise<TApiResponse<{ success: true }>> {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return {
        data: null,
        error: 'Usuário não autenticado',
        success: false,
      }
    }

    // Check if current user is owner
    const isOwner = await isAccountOwner(accountId)
    if (!isOwner) {
      return {
        data: null,
        error: 'Apenas o dono da conta pode remover membros',
        success: false,
      }
    }

    // Don't allow removing the owner
    const { data: account } = await supabase
      .from('accounts')
      .select('owner_id')
      .eq('id', accountId)
      .single()

    if (account?.owner_id === userId) {
      return {
        data: null,
        error: 'Não é possível remover o dono da conta',
        success: false,
      }
    }

    // Remove member
    const { error } = await supabase
      .from('account_members')
      .delete()
      .eq('account_id', accountId)
      .eq('user_id', userId)

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    revalidatePath(`/settings`)

    return {
      data: { success: true },
      error: null,
      success: true,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao remover membro',
      success: false,
    }
  }
}
