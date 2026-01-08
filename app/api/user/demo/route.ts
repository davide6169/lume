import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyDemoToken } from '@/lib/auth/demo-auth'

/**
 * API endpoint to check if current user is a demo user
 * Returns demo user info if authenticated with demo token
 */
export async function GET() {
  const cookieStore = await cookies()
  const demoToken = cookieStore.get('demo_token')?.value

  if (!demoToken) {
    return NextResponse.json({ isDemo: false })
  }

  const demoUser = await verifyDemoToken(demoToken)

  if (!demoUser) {
    return NextResponse.json({ isDemo: false })
  }

  return NextResponse.json({
    isDemo: true,
    user: demoUser,
  })
}
