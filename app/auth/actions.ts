'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { verifyDemoCredentials, generateDemoToken, isDemoEmail } from '@/lib/auth/demo-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Check if this is a demo login
  if (isDemoEmail(email)) {
    if (verifyDemoCredentials(email, password)) {
      // Generate demo JWT token
      const token = await generateDemoToken()

      // Set demo token in cookie
      const cookieStore = await cookies()
      cookieStore.set('demo_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      revalidatePath('/', 'layout')
      redirect('/')
    } else {
      redirect('/login?error=' + encodeURIComponent('Invalid demo credentials'))
    }
  }

  // Normal Supabase login
  const supabase = await createSupabaseServerClient()

  const data = {
    email,
    password,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    fullName: formData.get('fullName') as string,
  }

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
      },
    },
  })

  if (error) {
    redirect('/signup?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * Logout with complete session cleanup
 * This is a server action, but it signals to the client to clean up localStorage
 */
export async function logout() {
  const supabase = await createSupabaseServerClient()

  // Sign out from Supabase
  await supabase.auth.signOut()

  // Clear all cookies including demo_token
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  for (const cookie of allCookies) {
    cookieStore.delete(cookie.name)
  }

  // Revalidate and redirect
  revalidatePath('/', 'layout')
  redirect('/login?loggedOut=true')
}
