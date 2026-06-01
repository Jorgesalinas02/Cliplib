import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cliplib.onrender.com'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      next: { revalidate: 0 },
    })
    const data = await res.json()
    return NextResponse.json({ ok: true, backend: data, ts: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 503 })
  }
}
