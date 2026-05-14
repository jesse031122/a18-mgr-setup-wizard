'use client'

import Link from 'next/link'

// The bookmarklet JS — runs inside the MGR browser tab
// Strategy: fetch MGR data (same-origin, no CORS), then open localhost with
// data encoded in URL param — avoids HTTPS→HTTP mixed-content blocking entirely
const BOOKMARKLET_CODE = `(async function(){
  const toast = (msg, bg) => {
    let el = document.getElementById('mgr-bm-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mgr-bm-toast';
      Object.assign(el.style, {
        position:'fixed', top:'20px', right:'20px', zIndex:'99999',
        padding:'14px 20px', borderRadius:'10px', fontFamily:'system-ui',
        fontSize:'14px', fontWeight:'500', boxShadow:'0 4px 20px rgba(0,0,0,0.4)',
        maxWidth:'320px', lineHeight:'1.4'
      });
      document.body.appendChild(el);
    }
    el.style.background = bg;
    el.style.color = '#fff';
    el.textContent = msg;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.remove(), 5000);
  };

  toast('Fetching MGR projects...', '#1e40af');

  try {
    const key = localStorage.getItem('api_key');
    if (!key) throw new Error('Not logged in — no api_key in localStorage');

    const res = await fetch('https://api.moregoodreviews.com/users/me/projects', {
      headers: { Authorization: 'Bearer ' + key, Accept: 'application/json' }
    });

    if (!res.ok) throw new Error('MGR API returned ' + res.status);
    const data = await res.json();

    const projects = data.data || (Array.isArray(data) ? data : []);
    if (!projects.length) {
      toast('No projects found.', '#b45309');
      return;
    }

    toast('Found ' + projects.length + ' projects — opening dashboard...', '#166534');

    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(projects))));
    window.open('http://localhost:3618/?mgr-import=' + encoded, '_blank');

  } catch(e) {
    toast('Error: ' + e.message, '#991b1b');
    console.error('[MGR Sync]', e);
  }
})();`

const BOOKMARKLET_HREF = `javascript:${encodeURIComponent(BOOKMARKLET_CODE)}`

export default function SyncPage() {
  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4">MGR Sync Bookmarklet</h1>
        <p className="text-zinc-400 text-sm mt-1">One-click sync from your MGR browser tab</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Step 1 — Drag */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
            <span className="text-sm font-medium text-white">Save to your bookmarks bar</span>
          </div>
          <div className="p-5 flex flex-col items-center gap-4">
            <p className="text-zinc-400 text-sm text-center">
              Drag this button up to your browser bookmarks toolbar
            </p>
            {/* The draggable bookmarklet link */}
            <a
              href={BOOKMARKLET_HREF}
              onClick={(e) => { e.preventDefault(); alert('Drag this button to your bookmarks bar — don\'t click it here!') }}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl text-sm cursor-grab active:cursor-grabbing select-none border-2 border-orange-400 shadow-lg"
              draggable
            >
              <span>⟳</span>
              <span>Sync MGR Clients</span>
            </a>
            <p className="text-zinc-600 text-xs text-center">
              If your bookmarks bar isn&apos;t visible: press <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">Ctrl+Shift+B</kbd>
            </p>
          </div>
        </div>

        {/* Step 2 — Use it */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
            <span className="text-sm font-medium text-white">Use it anytime</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {[
              { icon: '1.', text: 'Go to testimonials.msplaunchpad.com (logged in)' },
              { icon: '2.', text: 'Click "Sync MGR Clients" in your bookmarks bar' },
              { icon: '3.', text: 'A toast notification confirms the sync' },
              { icon: '4.', text: 'Come back here — dashboard is updated' },
            ].map((s) => (
              <div key={s.icon} className="flex items-start gap-3 text-sm">
                <span className="text-zinc-600 font-mono w-4 flex-shrink-0">{s.icon}</span>
                <span className="text-zinc-300">{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What it syncs */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">What gets synced</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Client name', 'from MGR project name'],
              ['Project slug', 'for deep-link URLs'],
              ['Custom domain', 'for CNAME monitoring'],
              ['API secret key', 'for review count'],
              ['New clients', 'added automatically'],
              ['Step progress', 'always preserved'],
            ].map(([label, desc]) => (
              <div key={label} className="bg-zinc-800 rounded-lg p-2.5">
                <p className="text-white font-medium">{label}</p>
                <p className="text-zinc-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-500">
          <p className="font-medium text-zinc-400 mb-1">How it works</p>
          <p>The bookmarklet runs inside your MGR browser tab — so it already has your login session. It calls MGR&apos;s own API from inside your browser (bypassing Cloudflare completely), then posts the project list to your local dashboard. No credentials stored, no servers needed.</p>
        </div>
      </div>
    </div>
  )
}
