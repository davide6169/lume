import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { publicEnv, hasRealApiKeys } from '@/lib/config/env'
import { verifyDemoToken } from '@/lib/auth/demo-auth'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/signup') ||
                     request.nextUrl.pathname.startsWith('/account-pending')

  // Check for demo token first
  const demoToken = request.cookies.get('demo_token')?.value
  let demoUser = null

  if (demoToken) {
    demoUser = await verifyDemoToken(demoToken)
  }

  // If demo user is authenticated, skip Supabase auth check
  if (demoUser) {
    // Demo user is authenticated
    // Redirect to home if on auth pages
    if (isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Allow access to protected routes
    return supabaseResponse
  }

  // Normal Supabase authentication flow
  // Always create Supabase client and check authentication
  // Even in demo mode, users must be authenticated to access protected routes
  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Check user status if authenticated
  if (user && !isAuthPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single()

    // Redirect to account pending page if status is pending
    if (profile?.status === 'pending' && request.nextUrl.pathname !== '/account-pending') {
      const url = request.nextUrl.clone()
      url.pathname = '/account-pending'
      return NextResponse.redirect(url)
    }
  }

  // Redirect to home if already authenticated
  if (user && isAuthPage && !request.nextUrl.pathname.startsWith('/account-pending')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single()

    // If pending, allow access to account-pending page
    if (profile?.status === 'pending') {
      if (request.nextUrl.pathname === '/account-pending') {
        return supabaseResponse
      }
      const url = request.nextUrl.clone()
      url.pathname = '/account-pending'
      return NextResponse.redirect(url)
    }

    // Otherwise redirect to home
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
