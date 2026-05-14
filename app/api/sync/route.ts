import { NextResponse } from 'next/server'
import { readClients, writeClients, readConfig, writeConfig } from '@/lib/store'
import { type MgrClient } from '@/lib/steps'
import { randomUUID } from 'crypto'

// Allow the MGR portal to POST directly to this endpoint
const CORS_ORIGIN = 'https://testimonials.msplaunchpad.com'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': CORS_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: Request) {
  const body = await req.json()

  // Capture MGR api_key if sent with the sync payload
  if (body.mgr_api_key) {
    const config = readConfig()
    writeConfig({ ...config, mgr_api_key: body.mgr_api_key })
  }

  let raw = body.projects ?? body.data ?? body
  if (!Array.isArray(raw)) raw = Object.values(raw).find((v: unknown) => Array.isArray(v)) ?? []

  if (raw.length === 0) {
    return NextResponse.json(
      { error: 'No projects found', raw: body },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  const existing = readClients()
  const now = new Date().toISOString()
  let added = 0
  let updated = 0

  for (const p of raw) {
    const name: string = p.name ?? p.title ?? 'Unknown'
    const slug: string = p.slug ?? p.uuid ?? String(p.id ?? '')
    const domain: string =
      p.cname?.name ??
      p.domain ??
      p.custom_domain ??
      (p.review_link ? new URL(p.review_link).hostname : '')
    const publicKey: string = p.public_key ?? p.secret_key ?? p.api_key ?? p.key ?? ''
    const mgr_id: number | undefined = p.id ? Number(p.id) : undefined

    const match = existing.find(
      (c) => (slug && c.mgr_project_slug === slug) || c.name.toLowerCase() === name.toLowerCase()
    )

    if (match) {
      if (slug) match.mgr_project_slug = slug
      if (domain) match.domain = domain
      if (publicKey) match.mgr_secret_key = publicKey
      if (mgr_id) (match as MgrClient & { mgr_id?: number }).mgr_id = mgr_id
      match.updated_at = now
      updated++
    } else {
      const client: MgrClient = {
        id: randomUUID(),
        name,
        business_name: name,
        client_email: '',
        domain,
        mgr_project_slug: slug,
        mgr_secret_key: publicKey,
        steps_completed: {},
        notes: 'Auto-synced from MGR',
        created_at: now,
        updated_at: now,
      }
      ;(client as MgrClient & { mgr_id?: number }).mgr_id = mgr_id
      existing.unshift(client)
      added++
    }
  }

  writeClients(existing)

  return NextResponse.json(
    { ok: true, total: existing.length, added, updated },
    { headers: CORS_HEADERS }
  )
}
