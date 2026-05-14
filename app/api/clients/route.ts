import { NextResponse } from 'next/server'
import { readClients, upsertClient } from '@/lib/store'
import { type MgrClient } from '@/lib/steps'
import { randomUUID } from 'crypto'

export async function GET() {
  return NextResponse.json(readClients())
}

export async function POST(req: Request) {
  const body = await req.json()
  const now = new Date().toISOString()
  const client: MgrClient = {
    id: randomUUID(),
    name: body.name,
    business_name: body.business_name ?? '',
    client_email: body.client_email ?? '',
    domain: body.domain ?? '',
    mgr_project_slug: body.mgr_project_slug ?? '',
    mgr_secret_key: body.mgr_secret_key ?? '',
    mgr_id: body.mgr_id ? Number(body.mgr_id) : undefined,
    website: body.website ?? '',
    brand_color: body.brand_color ?? '',
    steps_completed: {},
    notes: body.notes ?? '',
    created_at: now,
    updated_at: now,
  }
  upsertClient(client)
  return NextResponse.json(client, { status: 201 })
}
