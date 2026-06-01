export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cliplib.onrender.com'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { cache: 'no-store' })
    const data = await res.json()
    return Response.json({ ok: true, backend: data, ts: new Date().toISOString() })
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 503 })
  }
}
