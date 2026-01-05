import { NextRequest, NextResponse } from 'next/server'
import { MetaGraphAPIService } from '@/lib/services/meta-graphapi'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    // Create service instance and validate token
    const service = new MetaGraphAPIService(accessToken)
    const validation = await service.validateToken()

    if (validation.valid) {
      return NextResponse.json({
        success: true,
        message: 'Token is valid',
        appName: validation.appName,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Invalid token',
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error validating Meta token:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to validate token',
      },
      { status: 500 }
    )
  }
}
