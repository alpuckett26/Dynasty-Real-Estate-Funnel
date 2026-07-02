# GO LIVE — Getting Leads Daily on Autopilot

Everything in this repo is built. **None of it produces leads until it's deployed
and the traffic sources below are switched on.** This is the activation order,
from fastest-to-first-lead to slowest.

---

## Phase 0 — Deploy (Day 1, ~2 hours) — REQUIRED FOR EVERYTHING

1. **Deploy to Vercel** — connect this repo, framework preset "Next.js".
2. **Set env vars** in Vercel → Settings → Environment Variables. Copy from
   `.env.example`. The must-haves to start funneling:
   - `OPENAI_API_KEY` — powers the chat + agents
   - `HUBSPOT_ACCESS_TOKEN` — the CRM everything lands in
   - `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` — SMS
   - `OWNER_PHONE` — Adreanne's cell (hot-lead + daily digest SMS)
   - `RESEND_API_KEY` / `FROM_EMAIL` / `REPLY_TO_EMAIL` / `DIGEST_EMAIL` — email
   - `SLACK_WEBHOOK_URL` — hot-lead + digest alerts (optional but recommended)
   - `CRON_SECRET` + `WEBHOOK_SECRET` — random strings, keep private
   - `NEXT_PUBLIC_CALENDLY_URL` — Adreanne's real booking link
3. **Run the HubSpot setup script once**: `npm run setup:hubspot`
   (creates all 24 custom properties + the 12-stage pipeline).
4. **Verify crons are on** — Vercel → Settings → Cron Jobs should show 4 jobs
   (lead-gen 7am, sequences 9am, reactivation 10am, daily digest 6pm — Central).

✅ After Phase 0: the website funnel pages, chat widget, lead scoring, hot-lead
alerts, and nurture sequences are all LIVE. Anyone who hits the site converts.

---

## Phase 1 — Paid leads on autopilot (Day 1–3) → **daily leads, guaranteed**

This is the only source that reliably produces leads *every day* from day one.

### Meta (Facebook + Instagram) Lead Ads → already wired end-to-end
- Endpoint is live at `/api/webhooks/meta`. Leads flow: FB/IG Instant Form →
  webhook → scored → HubSpot → hot-lead SMS to Adreanne → nurture sequence
  starts instantly. **Speed-to-lead: under 60 seconds, 24/7.**
- Setup (one time, ~1 hour):
  1. developers.facebook.com → create app → add **Webhooks** product
  2. Subscribe to object **Page**, field **`leadgen`**
  3. Callback URL: `https://<your-domain>/api/webhooks/meta`,
     verify token = the `META_VERIFY_TOKEN` you set in Vercel
  4. Generate a Page access token with `leads_retrieval` permission →
     set as `META_PAGE_ACCESS_TOKEN`; app secret → `META_APP_SECRET`
- Campaign settings (compliance — do not skip):
  - **Special Ad Category: Housing** (required by Meta for real estate)
  - Instant Form must include a **"You agree we may text you" checkbox** —
    the webhook only sets SMS consent when that field is checked
- Instant Form questions to add (the webhook auto-maps them):
  `Are you buying or selling?` · `When are you looking to move?` ·
  `Are you pre-approved?` · `What area are you interested in?`
- Budget math for Baton Rouge: real-estate lead-form CPLs typically run
  **$8–20**. At **$30/day → roughly 2–4 leads every day**; $50/day → 3–6.
  Best-performing angles for ATR: **$15K down-payment-assistance quiz**,
  **Healthcare Hero program**, **"What's your home worth?" (sellers)**.

### Google Business Profile (free, 15 min)
Claim/optimize the GBP listing, add the site link + booking link. Calls route
through CallRail → `/api/webhooks` (already handled).

---

## Phase 2 — Organic autopilot (Week 1) → free daily lead flow

### Instagram DM automation (ManyChat) — flows already written
- Import the 6 flows from `config/manychat-flows.json` into ManyChat Pro ($15/mo).
- Connect ManyChat → webhook URL `https://<domain>/api/webhooks` (type `manychat`,
  signed with `WEBHOOK_SECRET`).
- Turn on the comment trigger: anyone commenting **"HOME"** on any post/reel gets
  the DM qualification flow → lands in HubSpot fully scored.
- Adreanne posts 3–4 reels/week with "comment HOME" CTAs — each becomes a
  permanent lead trap. This compounds: old reels keep producing.

### Scraper cron (already running daily at 7am once deployed)
- **Reddit intent monitor** + **City-Data forum monitor** run automatically and
  load prospects into HubSpot tagged for manual outreach (no auto-DM — platform
  rules). Craigslist FSBO is blocked from cloud IPs — run
  `npm run leadgen:local` from a home machine weekly for FSBO seller leads.
- Expect 2–10 prospects/day. These are colder; they feed the pipeline's top.

### Open houses (every weekend event = 10–30 captured leads)
- Add each event to `data/open-houses.json`, print the QR code to
  `/open-house/<event-id>`. Every sign-in gets instant SMS/email follow-up +
  sequence enrollment. Borrow other agents' open houses if none are scheduled.

---

## Phase 3 — Database reactivation (Week 1–2) → fastest revenue, zero ad spend

- Import Adreanne's ENTIRE past contact list (old leads, past clients, sphere,
  phone contacts) into HubSpot with `consent_email = true` where she has an
  existing business relationship.
- The reactivation cron (10am daily) + 5 nurture sequences take over from there.
- Industry benchmark: a 300-contact dormant database typically yields
  **10–20 re-engaged conversations and 2–5 appointments in the first 30 days.**

---

## How the client sees leads DAILY

| Time (CT) | What fires | Where it shows up |
|---|---|---|
| Real-time | Hot lead (score ≥70) from any source | SMS to Adreanne + Slack, within seconds |
| Real-time | Meta lead ad submission | HubSpot contact + instant sequence step 0 |
| 7:00 AM | Scraper run summary | SMS if new prospects found |
| 9:00 AM | Sequence steps due today | Emails/SMS go out to leads |
| 10:00 AM | Reactivation batch | Dormant leads get re-engagement touch |
| 6:00 PM | **Daily Lead Digest** | Email + SMS + Slack: every lead from the last 24h, by source and temperature, hot ones listed with phone numbers |

The 6pm digest fires **even on a zero day** — so a quiet day is visible
immediately instead of discovered a week later.

---

## Minimum viable "leads tomorrow" checklist

- [ ] Vercel deployed, env vars set, `npm run setup:hubspot` run
- [ ] Meta Business Suite: 1 lead campaign live, $30/day, Housing category
- [ ] Meta webhook subscribed (`leadgen` → `/api/webhooks/meta`)
- [ ] ManyChat flows imported + "HOME" comment trigger on
- [ ] Past-client list imported into HubSpot
- [ ] Test: submit the site's intake form → confirm HubSpot contact + SMS alert
- [ ] Test: `curl https://<domain>/api/cron/daily-digest?secret=<CRON_SECRET>`
      → confirm digest email/SMS arrives
