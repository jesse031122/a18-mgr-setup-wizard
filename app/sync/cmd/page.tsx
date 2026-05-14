'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

function buildSyncScript(origin: string) {
  const api = `${origin}/api/sync`
  const dash = origin
  return `(async function(){var key=localStorage.getItem('api_key');if(!key){alert('Not logged in to MGR');return;}var r=await fetch('https://api.moregoodreviews.com/users/me/projects',{headers:{Authorization:'Bearer '+key,Accept:'application/json'}});if(!r.ok){alert('MGR API error: '+r.status);return;}var d=await r.json();var projects=d.data||(Array.isArray(d)?d:[]);if(!projects.length){alert('No projects found');return;}var slim=projects.map(function(p){return{id:p.id,name:p.name,slug:p.slug,public_key:p.public_key,domain:p.cname?p.cname.name:(p.review_link?new URL(p.review_link).hostname:'')};});var res=await fetch('${api}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projects:slim,mgr_api_key:key})});if(!res.ok){alert('Dashboard sync failed: '+res.status);return;}var result=await res.json();alert('Synced! '+result.added+' added, '+result.updated+' updated. Opening dashboard...');window.location.href='${dash}';})();`
}

const DISCOVERY_SCRIPT = `(async function(){var key=localStorage.getItem('api_key');if(!key){console.error('Not logged in');return;}var h={Authorization:'Bearer '+key,Accept:'application/json','Content-Type':'application/json'};var base='https://api.moregoodreviews.com';var pr=await fetch(base+'/users/me/projects',{headers:h});var pd=await pr.json();var projects=pd.data||(Array.isArray(pd)?pd:[]);if(!projects.length){console.error('No projects');return;}var p=projects[0];var id=p.id;console.log('%c=== PUT TEST: '+p.name+' (id='+id+') ===','color:#ff8f4f;font-weight:bold;font-size:14px');var r1=await fetch(base+'/projects/'+id,{headers:h});var d1=await r1.json();var proj=d1.data;console.log('%cCurrent sender_replyto: '+proj.sender_replyto,'color:#94a3b8');console.log('%cCurrent color_primary: '+proj.color_primary,'color:#94a3b8');console.log('%cCurrent meta_title: '+proj.meta_title,'color:#94a3b8');console.log('%c--- Testing PUT with same data (safe, no actual change) ---','color:#fbbf24;font-weight:bold');var putRes=await fetch(base+'/projects/'+id,{method:'PUT',headers:h,body:JSON.stringify({name:proj.name,website:proj.website,color_primary:proj.color_primary,sender_name:proj.sender_name,sender_replyto:proj.sender_replyto,meta_title:proj.meta_title,meta_description:proj.meta_description,email_footer:proj.email_footer,lang:proj.lang,currency:proj.currency})});console.log('%cPUT status: '+putRes.status,'color:'+(putRes.status<300?'#4ade80':'#ef4444')+';font-weight:bold');var putData=await putRes.json();console.log(JSON.stringify(putData,null,2));console.log('%c--- Testing POST /projects/'+id+'/locations ---','color:#fbbf24;font-weight:bold');var locRes=await fetch(base+'/projects/'+id+'/locations',{method:'POST',headers:h,body:JSON.stringify({name:'TEST LOCATION - DELETE ME',title:'Test'})});console.log('%cPOST location status: '+locRes.status,'color:'+(locRes.status<300?'#4ade80':'#ef4444')+';font-weight:bold');var locData=await locRes.json();console.log(JSON.stringify(locData,null,2));if(locData.data&&locData.data.id){var delRes=await fetch(base+'/locations/'+locData.data.id,{method:'DELETE',headers:h});console.log('%cDELETE test location status: '+delRes.status,'color:#94a3b8');}console.log('%c=== Done ===','color:#ff8f4f;font-weight:bold');})();`

function CopyCard({
  title,
  subtitle,
  script,
  buttonLabel,
  accent,
}: {
  title: string
  subtitle: string
  script: string
  buttonLabel: string
  accent: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!script) return
    try {
      await navigator.clipboard.writeText(script)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      const el = document.getElementById('script-' + title) as HTMLTextAreaElement
      el?.select()
    }
  }

  return (
    <div className="msp-card p-5 flex flex-col gap-3">
      <div>
        <p className="font-bold text-white text-sm">{title}</p>
        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{subtitle}</p>
      </div>
      <button
        onClick={copy}
        className="w-full py-3 rounded-xl font-bold text-sm transition-all"
        style={copied
          ? { background: '#166534', color: '#4ade80' }
          : { background: accent, color: '#0a0a0a' }
        }
      >
        {copied ? '✓ Copied! Go paste in MGR console' : buttonLabel}
      </button>
      <textarea
        id={'script-' + title}
        readOnly
        value={script}
        rows={2}
        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
        className="w-full rounded-lg px-3 py-2 font-mono-msp text-[10px] resize-none focus:outline-none cursor-text"
        style={{ background: '#080604', border: '1px solid #221a10', color: '#374151' }}
      />
    </div>
  )
}

export default function CmdPage() {
  const [syncScript, setSyncScript] = useState('')

  useEffect(() => {
    setSyncScript(buildSyncScript(window.location.origin))
  }, [])

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/" className="font-mono-msp text-sm transition-colors" style={{ color: '#64748b' }}>
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-black text-white mt-4">Console Scripts</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          Copy a script, go to MGR → F12 → Console → Ctrl+V → Enter
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <CopyCard
          title="Sync Clients"
          subtitle="Pulls all MGR projects into this dashboard"
          script={syncScript}
          buttonLabel="Copy Sync Script"
          accent="#ff8f4f"
        />

        <CopyCard
          title="API Discovery"
          subtitle="Probes MGR's API to find what endpoints we can automate — run once, screenshot the console output"
          script={DISCOVERY_SCRIPT}
          buttonLabel="Copy Discovery Script"
          accent="#35eded"
        />

        <div className="msp-card p-4 text-xs" style={{ color: '#64748b' }}>
          <p className="font-bold mb-2" style={{ color: '#94a3b8' }}>How to paste in Chrome</p>
          <ol className="flex flex-col gap-1.5">
            {[
              'Go to testimonials.msplaunchpad.com (logged in)',
              'Press F12 → click the Console tab',
              'If Chrome says "allow pasting" — type that phrase, press Enter, then paste again',
              'Ctrl+V → Enter',
            ].map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono-msp flex-shrink-0" style={{ color: '#ff8f4f' }}>{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>

        <a
          href="https://testimonials.msplaunchpad.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-orange w-full text-center py-3 rounded-xl text-sm font-bold"
        >
          Open MGR ↗
        </a>
      </div>
    </div>
  )
}
