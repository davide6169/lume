import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('TEST POST ROUTE CALLED')

  try {
    const body = await request.json()
    console.log('Request body:', body)

    return NextResponse.json({
      message: 'POST test successful',
      received: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('TEST POST error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  console.log('TEST GET ROUTE CALLED')
  return NextResponse.json({
    message: 'GET test successful',
    timestamp: new Date().toISOString()
  })
}
