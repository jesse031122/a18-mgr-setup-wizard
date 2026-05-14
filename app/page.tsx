'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { STEPS, type MgrClient } from '@/lib/steps'

interface ClientStatus {
  dns: { status: string; resolvedTo?: string }
  mgr: { reviewCount: number; lastReviewDate: string | null }
}

// POSTs directly to the dashboard API (CORS-enabled), then navigates back.
// No window.open() = no popup blocker issues.
function buildSyncScript(origin: string) {
  const api = `${origin}/api/sync`
  const dash = origin
  return `(async function(){var key=localStorage.getItem('api_key');if(!key){alert('Not logged in to MGR');return;}var r=await fetch('https://api.moregoodreviews.com/users/me/projects',{headers:{Authorization:'Bearer '+key,Accept:'application/json'}});if(!r.ok){alert('MGR API error: '+r.status);return;}var d=await r.json();var projects=d.data||(Array.isArray(d)?d:[]);if(!projects.length){alert('No projects found');return;}var slim=projects.map(function(p){return{id:p.id,name:p.name,slug:p.slug,public_key:p.public_key,domain:p.cname?p.cname.name:(p.review_link?new URL(p.review_link).hostname:'')};});var res=await fetch('${api}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projects:slim,mgr_api_key:key})});if(!res.ok){alert('Dashboard sync failed: '+res.status);return;}var result=await res.json();alert('Synced! '+result.added+' added, '+result.updated+' updated. Opening dashboard...');window.location.href='${dash}';})();`
}

function DomainBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; border: string; text: string; label: string }> = {
    live:         { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)',  text: '#4ade80', label: 'Live' },
    pending:      { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)',  text: '#fbbf24', label: 'Pending' },
    error:        { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   text: '#ef4444', label: 'Error' },
    unconfigured: { bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)', text: '#64748b', label: 'No domain' },
  }
  const s = map[status] ?? map.pending
  return (
    <span
      className="font-mono-msp text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
      style={{ background: s.bg, borderColor: s.border, color: s.text }}
    >
      {s.label}
    </span>
  )
}

function ClientCard({ client, onDelete }: { client: MgrClient; onDelete: (id: string) => void }) {
  const [status, setStatus] = useState<ClientStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)

  const done = Object.values(client.steps_completed ?? {}).filter(Boolean).length
  const total = STEPS.length
  const pct = Math.round((done / total) * 100)
  const accentColor = pct === 100 ? '#4ade80' : pct > 0 ? '#ff8f4f' : '#374151'
  const barColor = pct === 100 ? '#4ade80' : '#ff8f4f'

  async function fetchStatus() {
    setLoadingStatus(true)
    try {
      const res = await fetch(`/api/clients/${client.id}/status`)
      if (res.ok) setStatus(await res.json())
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => { fetchStatus() }, [client.id])

  async function handleDelete() {
    if (!confirm(`Remove ${client.name}?`)) return
    await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
    onDelete(client.id)
  }

  const lastReview = status?.mgr?.lastReviewDate
    ? new Date(status.mgr.lastReviewDate).toLocaleDateString()
    : null

  return (
    <div
      className="msp-card p-5 flex flex-col gap-4"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      {/* Name row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-white text-[15px] leading-tight truncate">{client.name}</h3>
          {client.business_name && client.business_name !== client.name && (
            <p className="text-[13px] mt-0.5 truncate" style={{ color: '#64748b' }}>{client.business_name}</p>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="text-xl leading-none flex-shrink-0 transition-colors mt-0.5"
          style={{ color: '#374151' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={e => (e.currentTarget.style.color = '#374151')}
          title="Remove client"
        >
          ×
        </button>
      </div>

      {/* Domain */}
      <div className="flex items-center gap-2 flex-wrap">
        {loadingStatus ? (
          <span className="font-mono-msp text-[10px] animate-pulse" style={{ color: '#64748b' }}>checking...</span>
        ) : (
          <DomainBadge status={status?.dns.status ?? 'unconfigured'} />
        )}
        {client.domain && (
          <span className="font-mono-msp text-[11px] truncate" style={{ color: '#64748b' }}>
            {client.domain}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[11px] mb-1.5">
          <span style={{ color: '#64748b' }}>{done}/{total} steps</span>
          <span className="font-bold" style={{ color: pct === 100 ? '#4ade80' : '#ff8f4f' }}>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1a1209' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      </div>

      {/* Review count (only when data exists) */}
      {status?.mgr && (status.mgr.reviewCount > 0 || lastReview) && (
        <div className="flex gap-4 text-[12px] border-t pt-3" style={{ borderColor: '#221a10', color: '#64748b' }}>
          <div>
            <span className="font-bold" style={{ color: '#e2e8f0' }}>{status.mgr.reviewCount}</span>
            <span className="ml-1">reviews</span>
          </div>
          {lastReview && (
            <div>
              <span>last </span>
              <span style={{ color: '#e2e8f0' }}>{lastReview}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <Link
          href={`/clients/${client.id}`}
          className="btn-orange flex-1 text-center text-sm py-2 rounded-lg"
        >
          Open Wizard →
        </Link>
        <button
          onClick={fetchStatus}
          disabled={loadingStatus}
          className="btn-ghost-orange px-3 py-2 rounded-lg text-sm"
          title="Refresh status"
        >
          {loadingStatus ? '·' : '↻'}
        </button>
      </div>
    </div>
  )
}

function SyncModal({ onClose, onSynced }: { onClose: () => void; onSynced: (msg: string) => void }) {
  const [copied, setCopied] = useState(false)
  const [script, setScript] = useState('')

  useEffect(() => {
    setScript(buildSyncScript(window.location.origin))
  }, [])

  async function copyScript() {
    if (!script) return
    try {
      await navigator.clipboard.writeText(script)
      setCopied(true)
    } catch {
      // fallback — select the textarea
      const el = document.getElementById('sync-script-box') as HTMLTextAreaElement
      el?.select()
    }
  }

  function openMGR() {
    window.open('https://testimonials.msplaunchpad.com', '_blank')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: '#0e0a07', border: '1px solid #3a2810' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-black text-white text-lg">Sync MGR Clients</h2>
            <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>3 steps — takes about 10 seconds</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: '#64748b' }}>×</button>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-3">
          {/* Step 1 */}
          <div className="rounded-xl p-4 flex gap-4 items-start" style={{ background: 'rgba(255,143,79,0.06)', border: '1px solid rgba(255,143,79,0.15)' }}>
            <span className="font-mono-msp font-black text-sm w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#ff8f4f', color: '#0a0a0a' }}>1</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm mb-2">Copy the sync script</p>
              <button
                onClick={copyScript}
                className="btn-orange text-sm px-4 py-2 rounded-lg w-full font-bold"
                style={copied ? { background: '#166534', color: '#4ade80' } : {}}
              >
                {copied ? '✓ Copied to clipboard!' : 'Copy Script'}
              </button>
              {/* Fallback textarea */}
              <textarea
                id="sync-script-box"
                readOnly
                value={script}
                rows={2}
                className="mt-2 w-full rounded-lg px-3 py-2 font-mono-msp text-[10px] resize-none focus:outline-none"
                style={{ background: '#080604', border: '1px solid #221a10', color: '#374151' }}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl p-4 flex gap-4 items-start" style={{ background: 'rgba(53,237,237,0.04)', border: '1px solid rgba(53,237,237,0.12)' }}>
            <span className="font-mono-msp font-black text-sm w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#35eded', color: '#0a0a0a' }}>2</span>
            <div className="flex-1">
              <p className="font-bold text-white text-sm mb-2">Open MGR and paste in console</p>
              <button onClick={openMGR} className="btn-cyan font-bold text-sm px-4 py-2 rounded-lg w-full">
                Open testimonials.msplaunchpad.com ↗
              </button>
              <div className="flex items-center gap-2 mt-3 text-xs flex-wrap" style={{ color: '#94a3b8' }}>
                <span>Then:</span>
                {['F12', 'Console tab', 'Ctrl+V', 'Enter'].map((k, i) => (
                  <span key={k} className="flex items-center gap-1.5">
                    <kbd className="font-mono-msp px-2 py-0.5 rounded text-[11px] font-bold" style={{ background: '#1a1209', border: '1px solid #3a2810', color: '#ff8f4f' }}>{k}</kbd>
                    {i < 3 && <span style={{ color: '#374151' }}>→</span>}
                  </span>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: '#64748b' }}>
                If Chrome says "allow pasting" — type that phrase first, press Enter, then paste again.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl p-4 flex gap-4 items-start" style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.12)' }}>
            <span className="font-mono-msp font-black text-sm w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#4ade80', color: '#0a0a0a' }}>3</span>
            <div>
              <p className="font-bold text-white text-sm">Come back here</p>
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                The script will show a confirmation alert, then bring you straight back to this dashboard with all clients updated.
              </p>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="btn-ghost-orange text-sm font-bold py-2 rounded-lg">
          Done / Close
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [clients, setClients] = useState<MgrClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncMsg, setSyncMsg] = useState('')
  const [showSyncModal, setShowSyncModal] = useState(false)

  const loadClients = useCallback(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setClients(d)
        else setError(d.error ?? 'Failed to load clients')
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const importData = params.get('mgr-import')
    if (importData) {
      try {
        const projects = JSON.parse(decodeURIComponent(escape(atob(importData))))
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projects }),
        })
          .then((r) => r.json())
          .then((result) => {
            setSyncMsg(`Synced — ${result.added ?? 0} added, ${result.updated ?? 0} updated`)
            window.history.replaceState({}, '', '/')
            loadClients()
          })
          .catch(() => setSyncMsg('Sync failed — check console'))
      } catch {
        setSyncMsg('Failed to decode import data')
      }
    } else {
      loadClients()
    }
  }, [loadClients])

  function handleSync() {
    setShowSyncModal(true)
  }

  const totalDone = clients.reduce(
    (acc, c) => acc + Object.values(c.steps_completed ?? {}).filter(Boolean).length,
    0
  )
  const totalSteps = clients.length * STEPS.length
  const overallPct = totalSteps > 0 ? Math.round((totalDone / totalSteps) * 100) : 0

  return (
    <div className="min-h-screen relative overflow-x-hidden">

      {showSyncModal && (
        <SyncModal
          onClose={() => setShowSyncModal(false)}
          onSynced={(msg) => { setSyncMsg(msg); setShowSyncModal(false) }}
        />
      )}

      {/* Ambient glows */}
      <div
        className="pointer-events-none fixed top-0 right-0 w-[700px] h-[700px]"
        style={{
          background: 'radial-gradient(circle at 70% 15%, #ff8f4f 0%, transparent 65%)',
          opacity: 0.07,
          animation: 'pulse-glow 4s ease-in-out infinite',
        }}
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 w-[500px] h-[500px]"
        style={{
          background: 'radial-gradient(circle at 25% 80%, #35eded 0%, transparent 65%)',
          opacity: 0.05,
          animation: 'pulse-glow 5s ease-in-out infinite',
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="font-mono-msp text-lg font-black tracking-tight"
                style={{ color: '#ff8f4f' }}
              >
                MGR
              </span>
              <span className="font-bold text-white text-base">Setup Dashboard</span>
            </div>
            <p className="font-mono-msp text-[11px] mt-0.5" style={{ color: '#64748b' }}>
              MoreGoodReviews · MSP Launchpad
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              className="btn-orange flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg"
            >
              <span style={{ fontSize: 15 }}>↻</span>
              <span>Sync MGR</span>
            </button>
            <Link
              href="/clients/new"
              className="btn-cyan text-sm font-bold px-4 py-2 rounded-lg"
            >
              + Add Client
            </Link>
          </div>
        </div>
        {/* Gradient rule */}
        <div className="h-px" style={{ background: 'linear-gradient(90deg, #ff8f4f 0%, #35eded 100%)' }} />
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Sync success */}
        {syncMsg && (
          <div
            className="mb-6 rounded-xl p-4 flex items-center justify-between"
            style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: '#4ade80' }}>✓</span>
              <span className="text-sm font-medium" style={{ color: '#4ade80' }}>{syncMsg}</span>
            </div>
            <button
              onClick={() => setSyncMsg('')}
              className="text-xl leading-none"
              style={{ color: '#64748b' }}
            >
              ×
            </button>
          </div>
        )}

        {/* Stats strip */}
        {clients.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Clients', value: String(clients.length), color: '#ff8f4f' },
              { label: 'Steps Done', value: `${totalDone}/${totalSteps}`, color: '#94a3b8' },
              { label: 'Completion', value: `${overallPct}%`, color: overallPct === 100 ? '#4ade80' : '#ff8f4f' },
            ].map((s) => (
              <div key={s.label} className="msp-card p-4">
                <p
                  className="font-mono-msp text-[10px] uppercase tracking-widest"
                  style={{ color: '#64748b' }}
                >
                  {s.label}
                </p>
                <p className="text-3xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-24 font-mono-msp text-sm" style={{ color: '#64748b' }}>
            Loading clients...
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="rounded-xl p-4 text-sm"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && clients.length === 0 && (
          <div className="text-center py-24">
            <p className="font-bold text-lg" style={{ color: '#94a3b8' }}>No clients synced yet</p>
            <p className="text-sm mt-2 mb-8" style={{ color: '#64748b' }}>
              Pull from MGR or add a client manually
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleSync}
                className="btn-orange text-sm px-6 py-3 rounded-lg flex items-center gap-2"
              >
                <span>↻</span> Sync MGR
              </button>
              <Link href="/clients/new" className="btn-cyan font-bold text-sm px-6 py-3 rounded-lg">
                + Add Client
              </Link>
            </div>
          </div>
        )}

        {/* Client grid */}
        {!loading && !error && clients.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((c) => (
              <ClientCard
                key={c.id}
                client={c}
                onDelete={(id) => setClients((cs) => cs.filter((x) => x.id !== id))}
              />
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
