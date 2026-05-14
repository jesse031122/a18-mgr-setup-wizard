'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewClient() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [brandColor, setBrandColor] = useState('#0064ff')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form.entries())
    // Include the color picker value (not a named input)
    body.brand_color = brandColor

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to save')
      setSaving(false)
      return
    }

    const client = await res.json()
    router.push(`/clients/${client.id}`)
  }

  const inputClass = "w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-colors"
  const inputStyle = { background: 'rgba(18,14,10,0.8)', border: '1px solid #221a10', color: '#e2e8f0' }

  return (
    <div className="min-h-screen relative">
      <div
        className="pointer-events-none fixed top-0 right-0 w-[400px] h-[400px]"
        style={{ background: 'radial-gradient(circle at 80% 10%, #ff8f4f 0%, transparent 65%)', opacity: 0.05 }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="font-mono-msp text-sm" style={{ color: '#64748b' }}>← Dashboard</Link>
          <span className="font-mono-msp text-[11px]" style={{ color: '#64748b' }}>New Client</span>
        </div>
        <div className="h-px" style={{ background: 'linear-gradient(90deg, #ff8f4f, #35eded)' }} />
      </header>

      <main className="max-w-xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Add New Client</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Creates a client record and opens the setup wizard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Section: Identity */}
          <div className="font-mono-msp text-[10px] uppercase tracking-widest" style={{ color: '#64748b' }}>
            Client Identity
          </div>

          <div>
            <label className="font-mono-msp text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: '#94a3b8' }}>
              Contact Name <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input name="name" required placeholder="John Smith" className={inputClass} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#ff8f4f')}
              onBlur={e => (e.target.style.borderColor = '#221a10')}
            />
          </div>

          <div>
            <label className="font-mono-msp text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: '#94a3b8' }}>
              Business Name <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input name="business_name" required placeholder="Acme Corp" className={inputClass} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#ff8f4f')}
              onBlur={e => (e.target.style.borderColor = '#221a10')}
            />
          </div>

          <div>
            <label className="font-mono-msp text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: '#94a3b8' }}>
              Client Email
            </label>
            <input name="client_email" type="email" placeholder="john@acmecorp.com" className={inputClass} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#ff8f4f')}
              onBlur={e => (e.target.style.borderColor = '#221a10')}
            />
          </div>

          {/* Section: Branding */}
          <div className="font-mono-msp text-[10px] uppercase tracking-widest pt-2" style={{ color: '#64748b' }}>
            Branding
          </div>

          <div>
            <label className="font-mono-msp text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: '#94a3b8' }}>
              Website
            </label>
            <input name="website" placeholder="https://acmecorp.com" className={inputClass} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#ff8f4f')}
              onBlur={e => (e.target.style.borderColor = '#221a10')}
            />
          </div>

          <div>
            <label className="font-mono-msp text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: '#94a3b8' }}>
              Brand Color
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={brandColor}
                onChange={e => setBrandColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer flex-shrink-0"
                style={{ border: '1px solid #221a10', background: 'none', padding: 2 }}
              />
              <input
                value={brandColor}
                onChange={e => setBrandColor(e.target.value)}
                placeholder="#0064ff"
                className={`flex-1 font-mono-msp ${inputClass}`}
                style={{ ...inputStyle, color: brandColor }}
                onFocus={e => (e.target.style.borderColor = '#ff8f4f')}
                onBlur={e => (e.target.style.borderColor = '#221a10')}
              />
            </div>
          </div>

          {/* Section: MGR */}
          <div className="font-mono-msp text-[10px] uppercase tracking-widest pt-2" style={{ color: '#64748b' }}>
            MGR Settings
          </div>

          <div>
            <label className="font-mono-msp text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: '#94a3b8' }}>
              Review Domain
            </label>
            <input name="domain" placeholder="reviews.acmecorp.com" className={inputClass} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#ff8f4f')}
              onBlur={e => (e.target.style.borderColor = '#221a10')}
            />
            <p className="font-mono-msp text-[10px] mt-1" style={{ color: '#374151' }}>
              Custom domain they'll use for their review page
            </p>
          </div>

          <div>
            <label className="font-mono-msp text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: '#94a3b8' }}>
              MGR Project ID
              <span className="ml-2 normal-case font-normal" style={{ color: '#374151' }}>— needed for Push to MGR</span>
            </label>
            <input name="mgr_id" type="number" placeholder="e.g. 4966" className={`font-mono-msp ${inputClass}`} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#35eded')}
              onBlur={e => (e.target.style.borderColor = '#221a10')}
            />
            <p className="font-mono-msp text-[10px] mt-1" style={{ color: '#374151' }}>
              Found in the MGR URL: /projects/<strong>4966</strong>/...
            </p>
          </div>

          <div>
            <label className="font-mono-msp text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: '#94a3b8' }}>
              Notes
            </label>
            <textarea
              name="notes"
              placeholder="Any extra context..."
              rows={2}
              className={`${inputClass} resize-none`}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#ff8f4f')}
              onBlur={e => (e.target.style.borderColor = '#221a10')}
            />
          </div>

          {error && (
            <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-orange flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-40"
            >
              {saving ? 'Creating...' : 'Create Client + Open Wizard →'}
            </button>
            <Link href="/" className="btn-ghost-orange px-5 py-3 rounded-xl text-sm font-bold">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
