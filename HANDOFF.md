# A18 — MGR Setup Wizard Handoff
> Updated: 2026-05-13

## What this is
A Next.js dashboard at `localhost:3618` for managing MoreGoodReviews client onboarding.
Folder: `C:\Users\jjens\MSP Launchpad\Bounties\A18 - MGR Setup Wizard`
Run: `npm run dev`

---

## What works right now

### Sync (WORKING)
- Click "↻ Sync MGR" on dashboard → modal opens with instructions
- Copy script → go to MGR tab (testimonials.msplaunchpad.com) → F12 → Console → Ctrl+V → Enter
- Script POSTs all projects directly to `/api/sync` (CORS enabled for MGR domain)
- Also captures your MGR `api_key` and saves it to `data/config.json` — needed for Push to MGR
- Dashboard refreshes automatically when done
- 16 real clients currently in `data/clients.json`

### Dashboard (WORKING)
- MSP-branded (Syne + DM Mono, orange/cyan, glow effects)
- Client cards with domain badges (Live/Pending/No domain via DNS check)
- Progress bars per client, stats strip at top
- Delete client, refresh status per card

### Wizard — Auto-Configure (WORKING, needs one test)
- Open any client → wizard page
- Fill in: Reply-to Email, Website, Brand Color
- Hit "⬆ Push to MGR" — makes a direct PUT to MGR's API from the browser
- What it pushes: sender name, reply-to email, brand color, website, meta title + description
- Requires `mgr_id` on the client (set automatically on synced clients) and `api_key` in config

### Wizard — Manual Steps (WORKING)
- 8-step checklist with checkboxes
- "Open in MGR" deep-links per step (uses project slug)
- Copy buttons for values (CNAME target, email, business name)
- Progress saved per client

### Add Client manually (WORKING)
- "+ Add Client" → form with all fields including MGR Project ID and brand color
- Creates client and opens wizard immediately

---

## What we know about the MGR API

| Endpoint | Method | Works | Notes |
|---|---|---|---|
| `/users/me/projects` | GET | Yes | Full project list with slugs |
| `/projects/{id}` | GET | Yes | All project fields |
| `/projects/{id}` | PUT | Yes | Writes: name, sender_name, sender_replyto, color_primary, website, meta_title, meta_description |
| `/projects/{id}` | PATCH | No | 405 — use PUT |
| `/projects/{id}/locations` | GET | Yes | Location list |
| `/projects/{id}/locations` | POST | Yes | Create location: name, title, address, city, state, postal_code |
| `/locations/{id}` | DELETE | Yes | Delete a location |
| `/projects/{id}/strategy` | GET | Yes | Read-only |
| `/projects/{id}/strategy` | PUT/PATCH | No | 405 |
| `/projects/{id}/settings` | GET | No | 404 |
| `/projects/{id}/domains` | GET | No | 404 — no domain API |

**Auth:** Bearer token = `localStorage.getItem('api_key')` from the MGR tab. Stored in `data/config.json` after first sync.

---

## What's still manual (no API)

- Custom domain / CNAME setup — no API endpoint exists
- Logo upload — no image endpoint found
- Strategy configuration — API is read-only
- Removing sample reviews — no delete endpoint found yet

---

## Key files

| File | What it does |
|---|---|
| `app/page.tsx` | Dashboard + sync modal |
| `app/clients/[id]/page.tsx` | Wizard with Auto-Configure panel |
| `app/clients/new/page.tsx` | Add client form |
| `app/sync/cmd/page.tsx` | Console script copy page (fallback + API discovery) |
| `app/api/sync/route.ts` | Receives sync payload, saves clients + api_key |
| `app/api/config/route.ts` | GET/POST for stored MGR api_key |
| `app/api/clients/[id]/route.ts` | GET/PATCH/DELETE per client |
| `lib/steps.ts` | MgrClient interface + 8-step definitions |
| `lib/store.ts` | File storage for clients.json + config.json |
| `data/clients.json` | 16 real MGR clients |
| `data/config.json` | Stores MGR api_key (created after first sync) |

---

## Next steps (in priority order)

1. **Test Push to MGR end-to-end** — create test client with mgr_id=4966, hit Push, verify in MGR
2. **Re-run sync once** — to capture api_key with the new payload (old syncs didn't include it)
3. **Get Lynn's real 8-step list** — `lib/steps.ts` has educated guesses, not confirmed steps
4. **Vercel deploy** — bounty requires a live URL; `data/` folder needs to persist (use Vercel Blob or keep local-only disclaimer)
5. **Location auto-create** — POST /locations API works, just need address fields in the client record
