import { NextResponse } from 'next/server'
import { VERANA_REST_ENDPOINT_METRICS } from '@/config/env'

export async function GET(): Promise<NextResponse> {
  if (!VERANA_REST_ENDPOINT_METRICS) {
    return NextResponse.json({ error: 'Missing metrics endpoint URL', code: 500 }, { status: 500 })
  }
  try {
    const response = await fetch(`${VERANA_REST_ENDPOINT_METRICS}/all`, { cache: 'no-store' })
    const payload: unknown = await response.json()
    return NextResponse.json(payload, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error), code: 502 },
      { status: 502 }
    )
  }
}
