'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SQL = `CREATE TABLE IF NOT EXISTS mgr_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL DEFAULT '',
  client_email TEXT NOT NULL DEFAULT '',
  domain TEXT NOT NULL DEFAULT '',
  mgr_project_slug TEXT NOT NULL DEFAULT '',
  mgr_secret_key TEXT NOT NULL DEFAULT '',
  steps_completed JSONB NOT NULL DEFAULT '{}',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`

const POLICY_SQL = `ALTER TABLE mgr_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON mgr_clients FOR ALL USING (true) WITH CHECK (true);`

const COMBINED = SQL + '\n\n' + POLICY_SQL

type TestStatus = 'idle' | 'testing' | 'ok' | 'fail'

export default function SetupPage() {
  const router = useRouter()
  const [copied, setCopied] = useState<string | null>(null)
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testMsg, setTestMsg] = useState('')

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function testConnection() {
    setTestStatus('testing')
    setTestMsg('')
    try {
      const res = await fetch('/api/clients')
      if (res.ok) {
        setTestStatus('ok')
        setTestMsg('Table found! Redirecting to dashboard...')
        setTimeout(() => router.push('/'), 1500)
      } else {
        const d = await res.json()
        setTestStatus('fail')
        setTestMsg(d.error ?? 'Table not found — run the SQL above first')
      }
    } catch {
      setTestStatus('fail')
      setTestMsg('Connection error — check your env vars')
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4">First-Time Setup</h1>
        <p className="text-zinc-400 text-sm mt-1">One-time step — takes about 30 seconds</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Step 1 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              <span className="text-sm font-medium text-white">Open Supabase SQL Editor</span>
            </div>
            <a
              href="https://supabase.com/dashboard/project/ftzelkdvqsnaxajqyqui/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              Open Editor ↗
            </a>
          </div>
          <p className="px-4 py-3 text-xs text-zinc-500">Click the button above to open the LaunchFlow Supabase SQL editor in a new tab.</p>
        </div>

        {/* Step 2 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              <span className="text-sm font-medium text-white">Paste &amp; Run this SQL</span>
            </div>
            <button
              onClick={() => copy(COMBINED, 'all')}
              className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              {copied === 'all' ? 'Copied ✓' : 'Copy All'}
            </button>
          </div>
          <pre className="px-4 py-3 text-xs text-zinc-300 overflow-auto leading-relaxed">
            <span className="text-zinc-600">{`-- Create table\n`}</span>
            {SQL}
            {'\n\n'}
            <span className="text-zinc-600">{`-- Enable access\n`}</span>
            {POLICY_SQL}
          </pre>
        </div>

        {/* Step 3 - Test */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
              <span className="text-sm font-medium text-white">Test &amp; Launch</span>
            </div>
            <button
              onClick={testConnection}
              disabled={testStatus === 'testing' || testStatus === 'ok'}
              className="text-xs bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              {testStatus === 'testing' ? 'Testing...' : testStatus === 'ok' ? 'Connected ✓' : 'Test Connection'}
            </button>
          </div>
          <div className="px-4 py-3">
            {testStatus === 'idle' && (
              <p className="text-xs text-zinc-500">After running the SQL above, click Test Connection to verify everything works.</p>
            )}
            {testStatus === 'testing' && (
              <p className="text-xs text-zinc-400 animate-pulse">Connecting to Supabase...</p>
            )}
            {testStatus === 'ok' && (
              <p className="text-xs text-green-400 font-medium">{testMsg}</p>
            )}
            {testStatus === 'fail' && (
              <p className="text-xs text-red-400">{testMsg}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
