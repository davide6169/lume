'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
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

  // Clear all cookies
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  for (const cookie of allCookies) {
    cookieStore.delete(cookie.name)
  }

  // Revalidate and redirect
  revalidatePath('/', 'layout')
  redirect('/login?loggedOut=true')
}
