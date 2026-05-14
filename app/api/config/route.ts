import { NextResponse } from 'next/server'
import { readConfig, writeConfig } from '@/lib/store'

export async function GET() {
  const config = readConfig()
  return NextResponse.json({ has_key: !!config.mgr_api_key, mgr_api_key: config.mgr_api_key ?? null })
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body.mgr_api_key) return NextResponse.json({ error: 'mgr_api_key required' }, { status: 400 })
  const config = readConfig()
  writeConfig({ ...config, mgr_api_key: body.mgr_api_key })
  return NextResponse.json({ ok: true })
}
