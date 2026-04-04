/**
 * Adreanne The Realtor — Email & SMS Nurture Sequences
 *
 * 5 branches based on intent + financial readiness.
 * Each message is fully written — no placeholders except {firstName}.
 * Delays are in hours from the previous message (or from registration for step 1).
 */

export type SequenceStep = {
  delayHours: number;
  channel: 'email' | 'sms';
  subject?: string; // email only
  body: string;
  tag?: string; // apply this tag after send
};

export type Sequence = {
  id: string;
  name: string;
  description: string;
  triggerTags: string[];
  steps: SequenceStep[];
};

// ─── Branch 1: Buyer – Ready Now (Hot) ───────────────────────────────────────

export const BUYER_HOT: Sequence = {
  id: 'buyer-hot',
  name: 'Buyer — Ready Now',
  description: 'Pre-approved or ready buyers with short timeline. Goal: book fast, move to showing.',
  triggerTags: ['Intent: Buyer', 'Timeline: Now'],
  steps: [
    {
      delayHours: 0,
      channel: 'email',
      subject: 'Your consultation is confirmed ✓',
      body: `Hi {firstName},

You're registered and we're ready to move. Here's what happens next:

1. Book your free consultation → {calendlyUrl}
2. We'll review your goals, pre-approval, and target areas
3. You'll leave with a clear game plan and a shortlist of homes to tour

Most of our buyers in your position are touring homes within 7–10 days of their first call. Let's get you there.

— Adreanne`,
    },
    {
      delayHours: 2,
      channel: 'sms',
      body: `Hi {firstName}, it's Adreanne The Realtor. Ready to find your home? Book your free consult here: {calendlyUrl} — takes 20 min.`,
    },
    {
      delayHours: 24,
      channel: 'email',
      subject: 'What to expect on your buyer consultation',
      body: `Hi {firstName},

Quick note on what we cover in your free buyer consultation:

✅ Your target neighborhoods and what's actually available in your budget
✅ The current offer climate (are multiple offers common? what's winning?)
✅ Any programs you qualify for — down payment assistance, rate buydowns, etc.
✅ A realistic timeline from consultation to keys

No pressure, no sales pitch. Just a straight conversation about your situation.

Book your spot here: {calendlyUrl}

Talk soon,
Adreanne`,
    },
    {
      delayHours: 48,
      channel: 'sms',
      body: `{firstName}, a home in your target area just hit the market. Want us to send you the details on your consultation call? Book here: {calendlyUrl}`,
      tag: 'Status: Consultation Reminder Sent',
    },
    {
      delayHours: 96,
      channel: 'email',
      subject: 'Pre-approval: what every buyer needs to know',
      body: `Hi {firstName},

Whether you're pre-approved or still working on it, here's what matters most in today's market:

**Pre-approval vs. pre-qualification**: Only pre-approval gives sellers confidence. If you haven't gotten a full pre-approval yet, this is the most important step before touring homes.

**What lenders look at**: Credit score (580+ for FHA, 620+ for conventional), 2 years of income history, debt-to-income ratio under 43%.

**Our lender network**: We work with several local lenders who close fast and treat buyers right. We're happy to make introductions on your consultation call.

Ready to talk? {calendlyUrl}

— Adreanne The Realtor`,
    },
  ],
};

// ─── Branch 2: Buyer – Needs Credit Repair ───────────────────────────────────

export const BUYER_CREDIT: Sequence = {
  id: 'buyer-credit',
  name: 'Buyer — Needs Credit Repair',
  description: 'Long-term nurture. Goal: educate, connect with resources, re-engage when ready.',
  triggerTags: ['Needs: Credit Repair'],
  steps: [
    {
      delayHours: 0,
      channel: 'email',
      subject: 'You may be closer to homeownership than you think',
      body: `Hi {firstName},

Thanks for registering with Adreanne The Realtor. A lot of people in your position assume homeownership is years away. That's often not true.

Here's what we know: FHA loans go as low as a 580 credit score. Some down payment assistance programs work with 620. And with the right credit repair plan, many buyers improve their score by 50–100 points in 6–12 months.

We'd love to introduce you to our credit counseling partner — a free resource that reviews your report and builds a step-by-step plan. No cost, no commitment.

Interested? Reply to this email or book a quick call: {calendlyUrl}

We'll be with you the whole way.

— Adreanne`,
    },
    {
      delayHours: 48,
      channel: 'sms',
      body: `Hi {firstName}, it's Adreanne. Our credit counseling partner helps buyers like you get ready fast — free of charge. Want an intro? Just reply YES.`,
    },
    {
      delayHours: 168, // 1 week
      channel: 'email',
      subject: '5 credit myths that are keeping buyers on the sidelines',
      body: `Hi {firstName},

Quick myth-buster for you:

❌ "I need a 700+ score to buy a home." → FALSE. FHA starts at 580.
❌ "I need 20% down." → FALSE. 3–5% is common. DPA programs can cover even that.
❌ "Collections will disqualify me." → SOMETIMES, but not always — depends on the type.
❌ "I have to wait 7 years after bankruptcy." → FALSE. FHA allows 2 years post-discharge.
❌ "Checking my credit hurts my score." → Soft pulls don't. Hard pulls have minimal impact.

Knowledge is the first step. When you're ready to take the next one, we're here.

Your free consultation: {calendlyUrl}

— Adreanne The Realtor`,
    },
    {
      delayHours: 336, // 2 weeks
      channel: 'email',
      subject: '3 things to do RIGHT NOW to improve your credit score',
      body: `Hi {firstName},

Three actions that move the needle fastest:

1. **Pay down revolving balances** — Getting your credit card balances below 30% of the limit is the single biggest score booster.

2. **Don't close old accounts** — Length of credit history matters. Keep old cards open even if unused.

3. **Dispute errors** — 1 in 5 credit reports has an error. Pull your free report at AnnualCreditReport.com and dispute anything inaccurate.

Most people see results within 30–60 days of doing all three.

When you hit your target score, your agent Adreanne will be ready to move fast. In the meantime, reply anytime with questions.

— Adreanne`,
    },
    {
      delayHours: 720, // 30 days
      channel: 'email',
      subject: 'Monthly check-in from Adreanne',
      body: `Hi {firstName},

Just checking in. How are things going on your homebuying journey?

If you've been working on your credit, we'd love to hear about your progress. If you've hit your target score or gotten pre-approved, it's time to start the fun part.

Our buyer consultation is always free and there's no pressure: {calendlyUrl}

Also — rates and programs change monthly. Reply and we'll send you the latest on down payment assistance programs available in your area right now.

Rooting for you,
Adreanne`,
      tag: 'Status: Monthly Check-In Sent',
    },
  ],
};

// ─── Branch 3: Buyer – 3–6 Months Out (Warm) ─────────────────────────────────

export const BUYER_WARM: Sequence = {
  id: 'buyer-warm',
  name: 'Buyer — 3–6 Months Out',
  description: 'Warm buyers in research mode. Goal: educate, build trust, convert to consultation.',
  triggerTags: ['Intent: Buyer', 'Timeline: 3-6 Months'],
  steps: [
    {
      delayHours: 0,
      channel: 'email',
      subject: 'Your homebuying roadmap (start here)',
      body: `Hi {firstName},

Thanks for registering with Adreanne The Realtor. Since you're planning ahead, here's the roadmap we walk every buyer through:

**Now (months 1–2)**
- Get pre-approved (even if you're not buying yet — it's free and tells you your exact budget)
- Research neighborhoods and decide on must-haves vs. nice-to-haves
- Review your credit and address any issues

**Middle (months 3–4)**
- Start touring homes to calibrate your expectations
- Connect with a buyer agent who knows the market cold
- Understand the offer process before you're in the heat of it

**Ready to buy (month 5–6)**
- Make offers with confidence
- Negotiate inspection, appraisal, and closing terms
- Close and get your keys

Want a personalized version of this plan? Book a free strategy call: {calendlyUrl}

— Adreanne`,
    },
    {
      delayHours: 72,
      channel: 'sms',
      body: `Hi {firstName}, Adreanne here. We put together a quick homebuying roadmap for you — check your email. Questions? Reply anytime.`,
    },
    {
      delayHours: 168,
      channel: 'email',
      subject: 'Down payment assistance: what\'s available right now',
      body: `Hi {firstName},

Good news: there are more programs to help buyers with their down payment than most people realize.

**What's typically available:**
- State and local HFA programs (often 3–5% assistance)
- Employer assistance programs (some companies offer this as a benefit)
- First-time buyer programs with reduced mortgage insurance
- Healthcare worker and public servant grants in many areas
- USDA loans (0% down in eligible rural/suburban areas)

Eligibility depends on your income, location, and loan type. We work with lenders who know these programs inside and out.

Want us to check what you qualify for? Book a call: {calendlyUrl}

— Adreanne The Realtor`,
    },
    {
      delayHours: 336,
      channel: 'email',
      subject: 'This week\'s mortgage rates + market update',
      body: `Hi {firstName},

This week's mortgage rates (Freddie Mac PMMS):

  30-year fixed:  {rate30yr}
  15-year fixed:  {rate15yr}
  5/1 ARM:        {rate5arm}

{rateChange}

Here's what this means for you as a buyer planning ahead:

The market is active in most price ranges. Homes under $400K are moving fast — often with multiple offers in the first week. Above $500K, buyers typically have more room to negotiate.

Don't wait for rates to drop before you start looking. Your purchasing power is largely set by your pre-approval. Locking in with the right lender now — even if you close in 3–6 months — gives you options.

Want us to connect you with a lender who can show you your exact numbers? {calendlyUrl}

— Adreanne`,
    },
    {
      delayHours: 504, // 3 weeks
      channel: 'email',
      subject: 'Savings & prep checklist before you buy',
      body: `Hi {firstName},

Beyond the down payment, here's what buyers often forget to budget for:

✅ **Closing costs**: 2–5% of the loan amount (can sometimes be rolled in or covered by seller concessions)
✅ **Home inspection**: $300–$500 — always worth it
✅ **Moving costs**: $1,000–$3,000 depending on distance and how much you have
✅ **Immediate repairs/updates**: Budget 1% of home value per year for maintenance
✅ **Utility deposits and overlap**: You may carry two housing costs for a month

Having a clear picture of your full number makes the process less stressful when the time comes.

Ready to build your personalized budget? Let's talk: {calendlyUrl}

— Adreanne The Realtor`,
      tag: 'Status: Warm Sequence Complete',
    },
  ],
};

// ─── Branch 4: Seller ─────────────────────────────────────────────────────────

export const SELLER: Sequence = {
  id: 'seller',
  name: 'Seller',
  description: 'Seller leads. Goal: deliver valuation, book listing appointment.',
  triggerTags: ['Intent: Seller'],
  steps: [
    {
      delayHours: 0,
      channel: 'email',
      subject: 'Your free home valuation is on the way',
      body: `Hi {firstName},

Thanks for reaching out to Dynasty. We're pulling your home's valuation now.

In the next 24 hours, your listing specialist will send you:
- An estimated market value range based on recent comparable sales
- A current market conditions summary for your area
- A suggested pricing strategy to attract multiple offers

While you wait, book a quick call to go over the numbers together: {calendlyUrl}

One thing sellers always ask: "Should I make updates before listing?" The answer depends entirely on your timeline and budget. We'll walk you through exactly what's worth doing and what isn't on your call.

Talk soon,
Adreanne`,
    },
    {
      delayHours: 4,
      channel: 'sms',
      body: `Hi {firstName}, it's Adreanne The Realtor. Your home valuation is being prepared. Book a quick call to review it together: {calendlyUrl}`,
    },
    {
      delayHours: 24,
      channel: 'email',
      subject: '3 things that affect your sale price more than you\'d expect',
      body: `Hi {firstName},

While we finalize your valuation, here are the three biggest levers sellers have:

**1. Pricing strategy**
The right price drives competition. Overpricing by even 5% dramatically reduces showings in the first two weeks — the most critical window.

**2. Presentation**
Professional photography isn't optional. Homes with pro photos sell for an average of $3,000–$11,000 more and spend less time on market. It's included in our listing package.

**3. Timing**
Spring and early fall are traditionally strongest, but the right home listed well will sell in any season. We track local demand weekly and advise accordingly.

Want to talk through your situation? Book here: {calendlyUrl}

— Adreanne The Realtor`,
    },
    {
      delayHours: 72,
      channel: 'sms',
      body: `{firstName}, just checking in — did you get our valuation email? Reply anytime or book a call: {calendlyUrl}`,
      tag: 'Status: Seller Follow-Up Sent',
    },
    {
      delayHours: 168,
      channel: 'email',
      subject: 'Prep tips to maximize your sale price',
      body: `Hi {firstName},

Here's our quick pre-listing checklist — the things that make the biggest difference for the least money:

🏠 **Declutter and depersonalize** — Buyers need to picture themselves there. Pack up personal photos and anything that makes rooms feel smaller.

🎨 **Fresh neutral paint** — One of the best ROI improvements. Light gray or warm white throughout.

💡 **Lighting** — Replace dated fixtures, max out bulb wattage, and add lamps where needed. Bright sells.

🌿 **Curb appeal** — Mow, mulch, pressure wash, and add a simple potted plant by the front door.

🔧 **Fix the obvious** — Leaky faucets, stuck doors, cracked caulk. Buyers notice small deferred maintenance.

We'll do a full walkthrough on your listing consult and give you a prioritized list specific to your home.

Book your consult: {calendlyUrl}

— Adreanne The Realtor`,
    },
  ],
};

// ─── Branch 5: Buyer + Seller (Both) ─────────────────────────────────────────

export const BUYER_SELLER: Sequence = {
  id: 'buyer-seller',
  name: 'Buyer + Seller',
  description: 'Coordinated buy/sell. Goal: book consultation, explain bridge/contingency strategy.',
  triggerTags: ['Intent: Both'],
  steps: [
    {
      delayHours: 0,
      channel: 'email',
      subject: 'Buying and selling at the same time — here\'s the plan',
      body: `Hi {firstName},

You've got one of the more complex situations in real estate — and one of the most exciting. Selling your current home while buying your next one requires coordination, but it's something we do regularly.

The good news: Adreanne handles both sides. That means one agent, one communication chain, and a strategy that keeps both transactions moving together.

Here's what we'll cover on your free consultation:
- Should you sell first or buy first? (depends on your market and finances)
- Bridge loan and contingency options
- How to time your closing dates so you're not stuck in limbo
- What to expect financially during the transition

Book your free consult: {calendlyUrl}

This is where having the right agent makes all the difference.

— Adreanne`,
    },
    {
      delayHours: 4,
      channel: 'sms',
      body: `Hi {firstName}, Adreanne here. Buying and selling together is our specialty. Book a quick strategy call: {calendlyUrl}`,
    },
    {
      delayHours: 48,
      channel: 'email',
      subject: 'Sell first or buy first? The honest answer',
      body: `Hi {firstName},

The question every buy-sell client asks: which do I do first?

**Sell first if:**
- You need the equity from your current home for the down payment
- You can't qualify for two mortgages at once
- You're okay with temporary housing between transactions

**Buy first if:**
- You have the financial flexibility to carry both for a short period
- You're in a competitive market where you can't afford to shop slowly
- Your current home will sell quickly (we'll tell you honestly if it will)

**The bridge loan option:**
Short-term financing that lets you buy before you sell. Works well in rising markets. Has costs, but eliminates the "homeless gap."

**The contingency offer:**
Making your purchase contingent on your sale. Accepted in some markets, a dealbreaker in others.

We'll tell you exactly which strategy makes sense for your specific situation on your call: {calendlyUrl}

— Adreanne The Realtor`,
    },
    {
      delayHours: 168,
      channel: 'email',
      subject: 'Timeline planning: what a buy-sell looks like start to finish',
      body: `Hi {firstName},

Here's a realistic timeline for a coordinated buy-sell transaction:

**Week 1–2**: Strategy call + list your home + begin home search
**Week 3–4**: Showings on your home + narrow down purchase targets
**Week 4–6**: Accept offer on your home + make offer on new home (ideally with a leaseback if needed)
**Day 30–45**: Inspections, appraisals, and lender conditions on both sides
**Closing day**: Ideally same day or within 24 hours of each other

This timeline is tight but achievable with the right agent coordinating both sides.

Ready to map yours out? {calendlyUrl}

— Adreanne The Realtor`,
      tag: 'Status: Both Sequence Complete',
    },
  ],
};

export const ALL_SEQUENCES: Sequence[] = [
  BUYER_HOT,
  BUYER_CREDIT,
  BUYER_WARM,
  SELLER,
  BUYER_SELLER,
];

/** Pick the right sequence based on a lead's tags */
export function selectSequence(tags: string[]): Sequence | null {
  if (tags.includes('Needs: Credit Repair')) return BUYER_CREDIT;
  if (tags.includes('Intent: Both')) return BUYER_SELLER;
  if (tags.includes('Intent: Seller')) return SELLER;
  if (tags.includes('Timeline: Now') || tags.includes('Timeline: 30-60 Days')) return BUYER_HOT;
  if (tags.includes('Intent: Buyer')) return BUYER_WARM;
  return null;
}
