# MGR Setup Wizard — A18

A Next.js dashboard for MSP onboarding clients into MoreGoodReviews (MGR). Built by Jesse for Bounty A18.

---

## What this does

When we onboard a new client into MGR, there are 8 setup steps that need to happen manually inside the MGR portal. This tool:

- Pulls all your MGR clients into a dashboard with one console script
- Tracks progress through each setup step per client with a checklist
- Auto-fills several fields (branding, email, website) directly into MGR via API with one click
- Gives you copy buttons and direct deep-links into the right MGR page for each step

---

## Current status (as of May 2026)

### Working
- **Sync from MGR** — one console script pulls all your projects into the dashboard
- **Dashboard** — client cards with Live/Pending/No domain badges, progress bars, stats strip
- **Per-client wizard** — 8-step checklist with "Open in MGR" deep-links and copy buttons
- **Auto-Configure** — fills sender name, reply-to email, brand color, website, meta title directly into MGR via API (one click, no manual entry)
- **Add Client manually** — form to create a client record outside of MGR sync

### Not yet done / needs Lynn's input
- **The 8 checklist steps are educated guesses** — the current steps are based on what we know about MGR setup, but Lynn needs to confirm these are the actual steps in the right order (see "What we need from Lynn" below)
- **Vercel deploy** — app runs locally for now, not yet on a live URL
- **Logo upload / custom domain** — MGR's API doesn't expose these endpoints, so these steps stay manual (no auto-configure possible)

---

## How to run it locally

```bash
npm install
npm run dev
# opens at http://localhost:3618
```

### First-time sync

1. Open the dashboard at `localhost:3618`
2. Click **Sync MGR** in the top right
3. Copy the script shown in the modal
4. Open MGR in another tab (`testimonials.msplaunchpad.com`)
5. Press F12 → Console tab → paste the script → Enter
6. Dashboard refreshes automatically with all your clients

---

## What we need from Lynn

The wizard's 8-step checklist currently contains our best guess at the MGR setup steps:

| Step | Current Label | Notes |
|------|--------------|-------|
| 1 | Create Project | Needs slug pasted back |
| 2 | Remove Sample Reviews | MGR adds demo reviews by default |
| 3 | Set Custom Domain | CNAME to `reviews.msplaunchpad.com` |
| 4 | Configure Review Page | Title, body text, T&C URL |
| 5 | Appearance & Branding | Logo + brand color |
| 6 | Email Settings | From name + reply-to |
| 7 | Review Strategy | Request flow and timing |
| 8 | Add Business Location | Address / location record |

**Questions for Lynn:**
1. Are these the right steps? Anything missing or in the wrong order?
2. Are there any steps that are actually done automatically / not needed for every client?
3. What is the CNAME target we give clients? (currently set to `reviews.msplaunchpad.com` — correct?)
4. Is there a standard review page title / T&C URL we use across clients?

---

## Auto-Configure — what it does and doesn't do

The "Push to MGR" button in the wizard Auto-Configure panel calls the MGR API directly and writes:

| Field | Source |
|-------|--------|
| Sender name | Client's business name |
| Reply-to email | Client email on file |
| Brand color | Brand color field |
| Website | Website field |
| Meta title | Business name |
| Meta description | Auto-generated |

**Cannot be automated** (no API endpoint in MGR):
- Custom domain / CNAME
- Logo upload
- Review strategy settings
- Removing sample reviews

---

## Key files

| File | What it does |
|------|-------------|
| `app/page.tsx` | Main dashboard |
| `app/clients/[id]/page.tsx` | Per-client wizard + Auto-Configure |
| `app/sync/cmd/page.tsx` | Console script for MGR sync |
| `lib/steps.ts` | The 8 checklist steps — **edit these with Lynn's input** |
| `data/clients.json` | Stored client records (16 real clients) |
