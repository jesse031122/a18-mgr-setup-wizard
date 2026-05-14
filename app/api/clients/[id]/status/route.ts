import { NextResponse } from 'next/server'
import { getClient } from '@/lib/store'
import { checkCname } from '@/lib/dns'
import { getMgrStats } from '@/lib/mgr'

const CNAME_TARGET = process.env.MGR_CNAME_TARGET ?? 'reviews.msplaunchpad.com'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = getClient(id)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [dns, mgr] = await Promise.all([
    checkCname(client.domain, CNAME_TARGET),
    getMgrStats(client.mgr_secret_key),
  ])

  return NextResponse.json({ dns, mgr })
}
