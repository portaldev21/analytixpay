'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, signupSchema } from '@/lib/validations'
import type { TApiResponse } from '@/db/types'

/**
 * Login with email and password
 */
export async function login(
  email: string,
  password: string
): Promise<TApiResponse<{ redirectTo: string }>> {
  try {
    // Validate input
    const validated = loginSchema.parse({ email, password })

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    })

    if (error) {
      return {
        data: null,
        error: error.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos'
          : error.message,
        success: false,
      }
    }

    revalidatePath('/', 'layout')

    return {
      data: { redirectTo: '/dashboard' },
      error: null,
      success: true,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao fazer login',
      success: false,
    }
  }
}

/**
 * Sign up with email and password
 */
export async function signup(
  email: string,
  password: string,
  confirmPassword: string,
  fullName?: string
): Promise<TApiResponse<{ redirectTo: string }>> {
  try {
    // Validate input
    const validated = signupSchema.parse({ email, password, confirmPassword, fullName })

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          full_name: validated.fullName || '',
        },
      },
    })

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    if (!data.user) {
      return {
        data: null,
        error: 'Erro ao criar usuário',
        success: false,
      }
    }

    // Create default account for new user
    const { error: accountError } = await supabase
      .from('accounts')
      .insert({
        name: 'Minha Conta',
        owner_id: data.user.id,
      })

    if (accountError) {
      console.error('Error creating default account:', accountError)
    }

    revalidatePath('/', 'layout')

    return {
      data: { redirectTo: '/dashboard' },
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
 * Logout
 */
export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Login with Google OAuth
 */
export async function loginWithGoogle(): Promise<TApiResponse<{ url: string }>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: { url: data.url },
      error: null,
      success: true,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao fazer login com Google',
      success: false,
    }
  }
}
