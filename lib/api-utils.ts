import { NextResponse } from 'next/server'

/**
 * Standard Next.js response with consistent error handling
 */
export function createNextResponse(
  data: unknown,
  init?: number | ResponseInit
) {
  const statusCode = typeof init === 'number' ? init : init?.status || 200
  const responseInit = typeof init === 'number' ? { status: init } : init

  return NextResponse.json(data, responseInit)
}
