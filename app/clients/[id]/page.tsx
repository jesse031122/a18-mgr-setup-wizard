'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { STEPS, type MgrClient } from '@/lib/steps'

const MGR_API = 'https://api.moregoodreviews.com'

// ─── Auto-Configure Panel ────────────────────────────────────────────────────

type PushState = 'idle' | 'pushing' | 'success' | 'error'

function AutoConfigure({ client, onUpdate }: { client: MgrClient; onUpdate: (updated: Partial<MgrClient>) => void }) {
  const [email, setEmail] = useState(client.client_email || '')
  const [website, setWebsite] = useState(client.website || '')
  const [brandColor, setBrandColor] = useState(client.brand_color || '#0064ff')
  const [pushState, setPushState] = useState<PushState>('idle')
  const [pushMsg, setPushMsg] = useState('')

  async function save(fields: Partial<MgrClient>) {
    await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    onUpdate(fields)
  }

  async function handlePush() {
    setPushState('pushing')
    setPushMsg('')

    try {
      // Save latest field values first
      await save({ client_email: email, website, brand_color: brandColor })

      // Get stored MGR api_key
      const configRes = await fetch('/api/config')
      const config = await configRes.json()
      if (!config.mgr_api_key) {
        setPushState('error')
        setPushMsg('MGR API key not found — run Sync MGR first to capture it.')
        return
      }
      if (!client.mgr_id) {
        setPushState('error')
        setPushMsg('No MGR project ID — re-sync from MGR.')
        return
      }

      // PUT directly to MGR API from the browser (bypasses Cloudflare)
      const mgrRes = await fetch(`${MGR_API}/projects/${client.mgr_id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${config.mgr_api_key}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: client.business_name || client.name,
          sender_name: client.business_name || client.name,
          sender_replyto: email || null,
          color_primary: brandColor,
          website: website || null,
          meta_title: `Review ${client.business_name || client.name}`,
          meta_description: `Share your experience with ${client.business_name || client.name}`,
        }),
      })

      if (!mgrRes.ok) {
        const err = await mgrRes.json().catch(() => ({}))
        throw new Error(err.message || `MGR returned ${mgrRes.status}`)
      }

      setPushState('success')
      setPushMsg('Pushed to MGR — sender name, reply-to, brand color, website, meta title.')
    } catch (e) {
      setPushState('error')
      setPushMsg(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  const inputStyle = {
    background: 'rgba(18,14,10,0.6)',
    border: '1px solid #221a10',
    color: '#e2e8f0',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    width: '100%',
    outline: 'none',
  }

  return (
    <div
      className="rounded-xl p-5 mb-6"
      style={{ background: 'rgba(53,237,237,0.03)', border: '1px solid rgba(53,237,237,0.15)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-white text-sm">Auto-Configure MGR</h2>
            <span
              className="font-mono-msp text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(53,237,237,0.1)', border: '1px solid rgba(53,237,237,0.2)', color: '#35eded' }}
            >
              API
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
            Push settings directly to this client's MGR project — no manual steps needed
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        <div>
          <label className="font-mono-msp text-[10px] uppercase tracking-wider block mb-1" style={{ color: '#64748b' }}>
            Reply-to Email
          </label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => save({ client_email: email })}
            placeholder="client@example.com"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = '#35eded')}
          />
        </div>

        <div>
          <label className="font-mono-msp text-[10px] uppercase tracking-wider block mb-1" style={{ color: '#64748b' }}>
            Website
          </label>
          <input
            value={website}
            onChange={e => setWebsite(e.target.value)}
            onBlur={() => save({ website })}
            placeholder="https://example.com"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = '#35eded')}
          />
        </div>

        <div>
          <label className="font-mono-msp text-[10px] uppercase tracking-wider block mb-1" style={{ color: '#64748b' }}>
            Brand Color
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={brandColor}
              onChange={e => setBrandColor(e.target.value)}
              onBlur={() => save({ brand_color: brandColor })}
              className="w-10 h-9 rounded-lg cursor-pointer flex-shrink-0"
              style={{ border: '1px solid #221a10', background: 'none', padding: 2 }}
            />
            <input
              value={brandColor}
              onChange={e => setBrandColor(e.target.value)}
              onBlur={() => save({ brand_color: brandColor })}
              placeholder="#0064ff"
              style={{ ...inputStyle, color: brandColor, fontFamily: 'var(--font-dm-mono, monospace)' }}
              onFocus={e => (e.target.style.borderColor = '#35eded')}
            />
          </div>
        </div>
      </div>

      {/* What gets pushed */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="text-[10px]" style={{ color: '#64748b' }}>Pushes:</span>
        {['Sender name', 'Reply-to email', 'Brand color', 'Website', 'Meta title + description'].map(f => (
          <span
            key={f}
            className="font-mono-msp text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: '#1a1209', border: '1px solid #221a10', color: '#64748b' }}
          >
            {f}
          </span>
        ))}
      </div>

      {/* Push button */}
      <button
        onClick={handlePush}
        disabled={pushState === 'pushing' || !client.mgr_id}
        className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
        style={
          pushState === 'success'
            ? { background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }
            : { background: '#35eded', color: '#0a0a0a' }
        }
      >
        {pushState === 'pushing' ? 'Pushing to MGR...' : pushState === 'success' ? '✓ Pushed!' : '⬆ Push to MGR'}
      </button>

      {!client.mgr_id && (
        <p className="text-xs text-center mt-2" style={{ color: '#64748b' }}>Re-sync from MGR to enable push</p>
      )}

      {pushMsg && (
        <p className="text-xs mt-2 leading-relaxed" style={{ color: pushState === 'success' ? '#4ade80' : '#f87171' }}>
          {pushState === 'success' ? '✓ ' : '✗ '}{pushMsg}
        </p>
      )}
    </div>
  )
}

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      disabled={!value}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-40"
      style={{ background: 'rgba(255,143,79,0.08)', border: '1px solid rgba(255,143,79,0.2)', color: '#ff8f4f' }}
    >
      {copied ? <><span style={{ color: '#4ade80' }}>✓</span><span style={{ color: '#4ade80' }}>Copied!</span></> : <><span>⧉</span><span>Copy {label}</span></>}
    </button>
  )
}

// ─── Step Row ─────────────────────────────────────────────────────────────────

function StepRow({
  step, index, client, done, onToggle, onSlugSave,
}: {
  step: (typeof STEPS)[0]
  index: number
  client: MgrClient
  done: boolean
  onToggle: (id: string) => void
  onSlugSave: (slug: string) => void
}) {
  const [slugInput, setSlugInput] = useState(client.mgr_project_slug ?? '')
  const [slugSaving, setSlugSaving] = useState(false)
  const [slugSaved, setSlugSaved] = useState(false)

  const slug = client.mgr_project_slug
  const mgrUrl = step.mgrPath(slug || 'PENDING')
  const needsSlug = !slug && index > 0
  const copyValue = step.copyValue ? step.copyValue(client) : null

  async function saveSlug() {
    if (!slugInput.trim()) return
    setSlugSaving(true)
    await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mgr_project_slug: slugInput.trim() }),
    })
    setSlugSaving(false)
    setSlugSaved(true)
    onSlugSave(slugInput.trim())
    setTimeout(() => setSlugSaved(false), 2000)
  }

  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={done
        ? { border: '1px solid rgba(74,222,128,0.2)', background: 'rgba(74,222,128,0.04)' }
        : { border: '1px solid #221a10', background: 'rgba(18,14,10,0.6)' }
      }
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(step.id)}
          className="mt-0.5 w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors"
          style={done
            ? { background: '#4ade80', borderColor: '#4ade80', color: '#0a0a0a' }
            : { borderColor: '#374151' }
          }
        >
          {done && <span className="text-xs font-black">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono-msp text-[10px]" style={{ color: '#374151' }}>Step {index + 1}</span>
            <span className="font-bold text-sm" style={{ color: done ? '#64748b' : '#e2e8f0', textDecoration: done ? 'line-through' : 'none' }}>
              {step.label}
            </span>
          </div>
          <p className="text-xs mt-1 mb-3" style={{ color: '#64748b' }}>{step.description}</p>

          <div className="flex flex-wrap gap-2">
            {needsSlug ? (
              <span className="text-xs italic" style={{ color: '#fbbf24' }}>Set project slug below first</span>
            ) : (
              <a
                href={mgrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors"
                style={{ background: 'rgba(53,237,237,0.06)', border: '1px solid rgba(53,237,237,0.2)', color: '#35eded' }}
              >
                <span>↗</span><span>Open in MGR</span>
              </a>
            )}
            {copyValue && <CopyButton value={copyValue} label={step.copyLabel} />}
          </div>

          {step.slugInput && (
            <div className="mt-3 flex gap-2 items-center">
              <input
                value={slugInput}
                onChange={e => setSlugInput(e.target.value)}
                placeholder="Paste MGR project slug (e.g. acme-corp)"
                className="flex-1 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                style={{ background: 'rgba(18,14,10,0.8)', border: '1px solid #221a10', color: '#e2e8f0' }}
              />
              <button
                onClick={saveSlug}
                disabled={slugSaving || !slugInput.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40"
                style={{ background: '#ff8f4f', color: '#0a0a0a' }}
              >
                {slugSaving ? '...' : slugSaved ? 'Saved ✓' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function SetupWizard() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<MgrClient | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchClient = useCallback(async () => {
    const res = await fetch(`/api/clients/${id}`)
    if (!res.ok) { router.push('/'); return }
    setClient(await res.json())
    setLoading(false)
  }, [id, router])

  useEffect(() => { fetchClient() }, [fetchClient])

  async function toggleStep(stepId: string) {
    if (!client) return
    const current = client.steps_completed ?? {}
    const updated = { ...current, [stepId]: !current[stepId] }
    setClient({ ...client, steps_completed: updated })
    await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps_completed: updated }),
    })
  }

  function handleSlugSave(slug: string) {
    if (client) setClient({ ...client, mgr_project_slug: slug })
  }

  function handleUpdate(fields: Partial<MgrClient>) {
    if (client) setClient({ ...client, ...fields })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="font-mono-msp text-sm animate-pulse" style={{ color: '#64748b' }}>Loading...</span>
    </div>
  )
  if (!client) return null

  const done = Object.values(client.steps_completed ?? {}).filter(Boolean).length
  const total = STEPS.length
  const pct = Math.round((done / total) * 100)
  const accentColor = pct === 100 ? '#4ade80' : '#ff8f4f'

  return (
    <div className="min-h-screen relative">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px]"
        style={{ background: 'radial-gradient(circle at 80% 10%, #ff8f4f 0%, transparent 65%)', opacity: 0.05, animation: 'pulse-glow 4s ease-in-out infinite' }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="font-mono-msp text-sm transition-colors" style={{ color: '#64748b' }}>
            ← Dashboard
          </Link>
          <div className="text-right">
            <span className="font-black text-xl" style={{ color: accentColor }}>{pct}%</span>
            <span className="font-mono-msp text-[11px] ml-2" style={{ color: '#64748b' }}>{done}/{total}</span>
          </div>
        </div>
        <div className="h-px" style={{ background: `linear-gradient(90deg, #ff8f4f, #35eded)` }} />
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Client header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">{client.name}</h1>
          {client.business_name && client.business_name !== client.name && (
            <p className="text-sm mt-0.5" style={{ color: '#94a3b8' }}>{client.business_name}</p>
          )}
          {client.domain && (
            <p className="font-mono-msp text-xs mt-1" style={{ color: '#64748b' }}>{client.domain}</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden mb-8" style={{ background: '#1a1209' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: accentColor }}
          />
        </div>

        {pct === 100 && (
          <div className="rounded-xl p-4 mb-6 text-sm text-center font-bold" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }}>
            All steps complete — client is fully set up.
          </div>
        )}

        {/* Auto-Configure Panel */}
        <AutoConfigure client={client} onUpdate={handleUpdate} />

        {/* Manual Steps */}
        <div className="mb-2 flex items-center gap-2">
          <span className="font-mono-msp text-[10px] uppercase tracking-widest" style={{ color: '#64748b' }}>Manual Steps</span>
          <div className="flex-1 h-px" style={{ background: '#221a10' }} />
        </div>
        <div className="flex flex-col gap-3 mt-3">
          {STEPS.map((step, i) => (
            <StepRow
              key={step.id}
              step={step}
              index={i}
              client={client}
              done={!!(client.steps_completed ?? {})[step.id]}
              onToggle={toggleStep}
              onSlugSave={handleSlugSave}
            />
          ))}
        </div>

        {/* Client details */}
        <div className="mt-8 rounded-xl p-4" style={{ border: '1px solid #221a10' }}>
          <h2 className="font-mono-msp text-[10px] uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>Client Record</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Email', value: client.client_email },
              { label: 'MGR Slug', value: client.mgr_project_slug },
              { label: 'MGR ID', value: client.mgr_id ? String(client.mgr_id) : '—' },
              { label: 'Domain', value: client.domain },
              { label: 'Website', value: client.website },
              { label: 'Brand Color', value: client.brand_color },
            ].map((f) => (
              <div key={f.label}>
                <span style={{ color: '#374151' }}>{f.label}: </span>
                <span style={{ color: '#94a3b8' }}>{f.value || '—'}</span>
              </div>
            ))}
          </div>
          {client.notes && (
            <p className="text-xs mt-3 border-t pt-3" style={{ borderColor: '#221a10', color: '#374151' }}>{client.notes}</p>
          )}
        </div>
      </main>
    </div>
  )
}
