import { NextResponse } from 'next/server'
import { getClient, upsertClient, deleteClient } from '@/lib/store'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = getClient(id)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = getClient(id)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const updated = { ...client, ...body, id, updated_at: new Date().toISOString() }
  upsertClient(updated)
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  deleteClient(id)
  return NextResponse.json({ ok: true })
}
