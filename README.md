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

## Testing with a demo client (Lynn's walkthrough)

This is the full end-to-end test to validate that the tool works before we finalize the steps and deploy it live.

### Step 1 — Get the app running

```bash
npm install
npm run dev
```

Open `http://localhost:3618` in your browser. You should see the dashboard with existing clients.

> **Note:** If Chrome warns about pasting scripts in the console, type `allow pasting` and press Enter, then paste again. This is a Chrome security prompt, not an error.

---

### Step 2 — Create a test project in MGR

1. Go to [testimonials.msplaunchpad.com](https://testimonials.msplaunchpad.com) and log in
2. Create a new project — call it something like **"TEST - Demo Client"** so it's easy to identify and delete later
3. Use a fake business name, fake email, anything — this is just for testing
4. Leave it mostly unconfigured for now (we'll configure it through the wizard)

---

### Step 3 — Sync MGR into the dashboard

1. Back in the dashboard at `localhost:3618`, click **Sync MGR** (top right corner)
2. A modal appears with a script — click **Copy Sync Script**
3. Go back to the MGR tab, press **F12**, click the **Console** tab
4. Paste with **Ctrl+V** and press **Enter**
5. You'll see an alert saying how many projects were added/updated — click OK
6. The dashboard reloads automatically and your TEST client should appear at the top

> **What happens behind the scenes:** The script grabs your MGR session token from the browser and uses it to pull all your projects via the MGR API. It also saves that token locally so the Auto-Configure push button can use it later.

---

### Step 4 — Open the wizard for your test client

1. Find the **"TEST - Demo Client"** card on the dashboard
2. Click it to open the wizard
3. You'll see two panels: the **8-step checklist** on the left, and **Auto-Configure** on the right

---

### Step 5 — Test Auto-Configure (the main thing to validate)

The Auto-Configure panel automatically writes several fields into MGR with one button press.

1. In the Auto-Configure panel, fill in:
   - **Reply-to email** — use any real-looking email (e.g. `demo@testbusiness.com`)
   - **Website** — e.g. `https://testbusiness.com`
   - **Brand color** — pick anything with the color picker
2. Click **Push to MGR**
3. You should see a green success message: *"Pushed to MGR — sender name, reply-to, brand color, website, meta title."*
4. Go back to MGR and open the test project settings — verify those fields actually changed

> **If you see an error:** The most common cause is the MGR API key not being captured. Re-run the sync script (Step 3) to refresh it, then try Push again.

---

### Step 6 — Test the checklist steps

1. Work through the 8 checklist steps in the left panel
2. Each step has an **"Open in MGR"** button that deep-links directly to the right page in MGR
3. Some steps have a **copy button** for values like the CNAME target or the business name
4. Check off each step as you complete it — progress saves automatically

> **This is where your feedback matters most.** Do the steps match what you actually do when onboarding a client? Anything missing, in the wrong order, or labelled wrong?

---

### Step 7 — Clean up

Once you're done testing, delete the TEST project from MGR and delete the card from the dashboard (trash icon on the client card).

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
