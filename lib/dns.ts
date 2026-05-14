export type DnsStatus = 'live' | 'pending' | 'error' | 'unconfigured'

export interface DnsResult {
  status: DnsStatus
  resolvedTo?: string
  error?: string
}

export async function checkCname(domain: string, _expectedTarget?: string): Promise<DnsResult> {
  if (!domain) return { status: 'unconfigured' }

  // Skip the MSP Launchpad base domain — it means no custom domain was configured
  if (domain === 'testimonials.msplaunchpad.com') return { status: 'unconfigured' }

  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=CNAME`,
      { headers: { Accept: 'application/dns-json' }, next: { revalidate: 300 } }
    )
    const data = await res.json()

    if (!data.Answer || data.Answer.length === 0) {
      const aRes = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`,
        { headers: { Accept: 'application/dns-json' }, next: { revalidate: 300 } }
      )
      const aData = await aRes.json()
      if (!aData.Answer || aData.Answer.length === 0) {
        return { status: 'pending' }
      }
      return { status: 'live', resolvedTo: aData.Answer[0].data }
    }

    const cname = data.Answer[0].data.replace(/\.$/, '')
    return { status: 'live', resolvedTo: cname }
  } catch (e) {
    return { status: 'error', error: String(e) }
  }
}
