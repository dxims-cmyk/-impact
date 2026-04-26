import type { WelcomePack as Pack } from '@/lib/welcome-packs/types'
import { PageShell } from './page-shell'

interface Props {
  pack: Pack
}

function fmtMoney(n: number): string {
  return n.toLocaleString('en-GB')
}

export function WelcomePack({ pack }: Props): React.JSX.Element {
  const c = pack.client
  const d = pack.deal
  const ad = pack.liveAd
  const t = pack.targets
  const lh = pack.leadHandling
  const r = pack.roadmap

  return (
    <article className="welcome-doc">
      {/* COVER */}
      <header className="mx-auto w-full max-w-3xl px-6 pb-8 pt-16 sm:px-10 md:pb-12 md:pt-24 print:pt-10">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-impact">
          : Welcome Pack
        </span>
        <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight text-navy sm:text-6xl md:text-7xl">
          {c.name}
        </h1>
        <p className="mt-6 text-xl text-navy/70">
          For {c.ownerFirstName} <br />
          {c.monthYear}
        </p>
        <p className="mt-10 max-w-xl text-base text-navy/60">
          The full picture of what AM:PM Media is doing for {c.name} over the next
          3 months. What to expect week by week. What to do when something feels
          off.
        </p>
      </header>

      {/* PAGE 1 — WELCOME */}
      <PageShell number={1} title="Welcome">
        <p>{c.ownerFirstName},</p>
        <p>
          This pack is yours. Print it, screenshot it, leave it on your phone.
          It&apos;s the full picture of what AM:PM Media is doing for {c.name} over
          the next 3 months, what to expect week by week, and what to do when
          something feels off.
        </p>
        <p>
          You signed {c.signedDateRelative}. Your first ad went live{' '}
          {c.launchDateRelative}. The system is already running while you read
          this. You don&apos;t need to do anything right now. The point of this pack
          is so you never have to ask &ldquo;what&apos;s happening?&rdquo; or &ldquo;is this
          normal?&rdquo; again. The answer is in here.
        </p>
        <p>
          A quick word about how to read this. Do not try to read the whole thing
          in one sitting. It&apos;s split into 12 short pages, one topic each. Read
          Page 2 (the deal) and Page 3 (the 3 month plan) tonight. Read Page 7
          (what to do when leads come in) before {c.nextKeyDay}. Save the rest
          for when something comes up.
        </p>

        <h3>The first 2 weeks will feel slow.</h3>
        <p>
          That is by design, not a problem. Meta needs time to learn who actually
          buys from you before it starts sending you the right people. If you are
          panicking on day 4 because you have 1 lead, that is normal. If you are
          still panicking on day 30 because you have 5 leads, then we have a real
          conversation. We are not there.
        </p>

        <h3>Your phone is your tool.</h3>
        <p>
          Everything important happens on your phone. Meta Ads Manager app,
          WhatsApp leads, Impact dashboard once it lands. You do not need a
          laptop. You do not need to learn anything technical. If a lead comes in
          and you reply within 5 minutes, you will close more jobs than 90% of{' '}
          {c.industryNoun} in {c.city}.
        </p>

        <h3>You are not on your own.</h3>
        <p>
          I am one WhatsApp message away. I run the ads, fix the things that
          break, deal with Meta when they get awkward, and tell you the truth
          about what&apos;s working. You {c.deliveryVerb}. That is the deal.
        </p>

        <p className="signature">
          Welcome aboard. <br />
          <strong>Colm</strong> <br />
          AM:PM Media
        </p>
      </PageShell>

      {/* PAGE 2 — THE DEAL */}
      <PageShell number={2} title="The Deal">
        <p>Plain language version of what you signed.</p>

        <h3>What you pay</h3>
        <ul>
          <li>
            <strong>£{d.weeklyRetainer}/week</strong> to AM:PM Media (every Monday
            or Friday, whichever lands cleaner for you)
          </li>
          <li>
            <strong>£{d.weeklyAdSpend}/week</strong> to Meta, billed direct to your
            card inside Meta Ads Manager
          </li>
        </ul>

        <h3>What that gets you</h3>
        <ul>
          <li>All ads built, written, launched, and managed by me</li>
          <li>All creative work (cuts, captions, copy, variations) included</li>
          <li>Lead capture set up and maintained</li>
          <li>Weekly written update every Monday morning</li>
          <li>Direct WhatsApp access to me, all week, all hours</li>
          {d.clientSpecificInclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>Impact dashboard access from week 2</li>
          <li>Full transparency, you can see your Meta account at any time</li>
        </ul>

        <h3>What you do not pay extra for</h3>
        <ul>
          <li>Edits to ads</li>
          <li>New ad variations</li>
          <li>Form changes</li>
          <li>Copy rewrites</li>
          <li>WhatsApp messaging me at 9pm because something looks weird</li>
        </ul>

        <h3>The trial structure</h3>
        <p>
          You are on a 3 month trial retainer. After month 3 we sit down, look at
          the numbers, and pick one of three paths.
        </p>
        <ol>
          <li>
            The ads are landing, you are doing £{fmtMoney(d.targetRevenueLow)} to
            £{fmtMoney(d.targetRevenueHigh)}+ a month. We move you onto Impact
            Core (£1,500/mo) which unlocks the full system. This is the goal.
          </li>
          <li>
            The ads are working but not at full pace. We extend the trial 1 to 2
            months at the same rate.
          </li>
          <li>
            The ads are not working and we cannot see a path forward. You walk.
            No tie-in, no clawback, no drama.
          </li>
        </ol>

        <h3>Why weekly billing</h3>
        <p>
          Most agencies want £500 to £1,500 upfront on the 1st of every month.
          That is bad cash flow for {c.industryNoun}. Weekly billing means you pay
          as the work happens. If anything goes sideways, you only ever owe one
          week. That is the same protection both ways. It also makes you pay
          attention week by week, which is the point.
        </p>
      </PageShell>

      {/* PAGE 3 — 3 MONTH PLAN */}
      <PageShell number={3} title="The 3 Month Plan">
        <p>
          Three months is not a guess, it is a system. Each month does a specific
          job. Skip a month and the next one breaks.
        </p>

        <h3>Month 1 — Train the algorithm</h3>
        <p className="muted">Weeks 1 to 4.</p>
        <p>
          Meta does not know who buys from you yet. It is showing the ad to a
          wide audience and watching who clicks, who fills in the form, who
          scrolls past. That data trains the system. By week 3 it will start
          sending you better leads, not because we changed anything, but because
          Meta now knows what your buyer looks like.
        </p>
        <p>What you should expect:</p>
        <ul>
          <li>
            Week 1 to 2: {t.week1to2Leads} leads per day. Some will be timewasters.
            That is fine, the system needs to see what timewasters look like too.
          </li>
          <li>
            Week 3 to 4: {t.week3to4Leads} leads per day. Quality starts climbing.
          </li>
        </ul>
        <p>
          Money in: £{fmtMoney(t.month1AdSpend)} ad spend, roughly. Money out:
          probably {t.month1Jobs} actual jobs if your follow-up is sharp.
        </p>

        <h3>Month 2 — Scale the winners</h3>
        <p className="muted">Weeks 5 to 8.</p>
        <p>
          By now we know which ad creative converts and which audience profile
          actually buys. We turn off the losers and put more budget behind the
          winners. We add testimonial-style ads from past clients (you supply the
          contacts in week 5). Testimonial ads almost always outperform polished
          ones.
        </p>
        <p>What you should expect:</p>
        <ul>
          <li>{t.month2Leads} leads per day</li>
          <li>
            First £{fmtMoney(d.targetRevenueLow)} to £{fmtMoney(d.targetRevenueHigh)} revenue month is realistic here
          </li>
          <li>WhatsApp will get noisy</li>
        </ul>

        <h3>Month 3 — Optimise and decide</h3>
        <p className="muted">Weeks 9 to 12.</p>
        <p>
          We expand outside {c.city} if the area is saturated. We push seasonal
          angles ({t.seasonalAngle}). We introduce a booking funnel so leads can
          self-qualify and pick a slot before you even speak to them.
        </p>
        <p>What you should expect:</p>
        <ul>
          <li>{t.month3Leads} leads per day at steady state</li>
          <li>£{fmtMoney(d.targetRevenueHigh)}+ months as the floor not the ceiling</li>
          <li>The conversation about Impact Core and what month 4 looks like</li>
        </ul>
      </PageShell>

      {/* PAGE 4 — HOW ADS WORK */}
      <PageShell number={4} title="How Meta Ads Actually Work">
        <p>
          You do not need to understand this to make money. You need to
          understand it so you do not panic when week 1 looks slow.
        </p>

        <h3>The 5 minute rule</h3>
        <p>
          Inside Meta there is a system called the algorithm. Its only job is to
          find the next person who will give you money. To do that it has to
          test. Show the ad to 1,000 people, watch who clicks, watch who fills in
          the form, watch who books. Each click teaches it something. After 50 to
          100 conversions it gets very good at finding the next 50 to 100. Before
          that, it is genuinely guessing.
        </p>

        <h3>Why £{d.weeklyAdSpend} a week and not £25</h3>
        <p>
          At £25 a week, Meta only has enough budget to show your ad to about 500
          people. 500 people is not enough for the algorithm to learn anything.
          It is starved.
        </p>
        <p>
          At £{d.weeklyAdSpend} a week, Meta can show your ad to about{' '}
          {pack.algorithm.weeklyReach} people. Out of those, around{' '}
          {pack.algorithm.weeklyEngagements} will engage. Out of those, around{' '}
          {pack.algorithm.weeklyLeads} will become leads. That is enough data for
          the algorithm to start spotting patterns and double down.
        </p>

        <h3>Why the early weeks feel slow</h3>
        <p>
          Because they are slow. Meta is still in the wide net phase. By week 3 it
          has narrowed. By week 6 it is sharp. By week 10 it is finding people
          who would have bought from you anyway, just faster.
        </p>

        <h3>Why I will not promise leads in week 1</h3>
        <p>
          Anyone who promises that is lying or scaling someone else&apos;s ad
          account they spent 6 months training. You are starting from zero. Zero
          takes 2 to 3 weeks to warm up. That is the truth.
        </p>

        <h3>Why we keep the same ad running for a while</h3>
        <p>
          Every time we change an ad significantly, Meta resets and starts
          learning again. We do not change for the sake of changing. We change
          when the data tells us to.
        </p>

        <p>
          If you ever feel uncertain about why we are doing something a specific
          way, ask. There is always a reason. I will explain it in plain language
          every time.
        </p>
      </PageShell>

      {/* PAGE 5 — LIVE AD SPEC */}
      <PageShell number={5} title="What is Running Right Now">
        <p>This is your live setup as of {c.launchDate}.</p>

        <div className="spec-box">
          <dl>
            <div>
              <dt>Campaign</dt>
              <dd>{ad.campaignName}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{ad.campaignType}, £{ad.dailyBudget}/day campaign budget</dd>
            </div>
            <div>
              <dt>Ad set</dt>
              <dd>{ad.adSetName}</dd>
            </div>
            <div>
              <dt>Identity</dt>
              <dd>Facebook Page {ad.fbPage} + Instagram {ad.igHandle}</dd>
            </div>
          </dl>
        </div>

        <h3>Who the ad is being shown to</h3>
        <ul>
          <li>Location: {ad.location}</li>
          <li>Age: {ad.ageRange}</li>
          <li>Gender: {ad.gender}</li>
          <li>Interests: {ad.interests.join(', ')}</li>
        </ul>

        <h3>The ad copy</h3>
        <blockquote>
          {ad.primaryText.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </blockquote>
        <p>
          Headline: <strong>{ad.headline}</strong>
          <br />
          Description: <strong>{ad.description}</strong>
          <br />
          Call to action button: <strong>{ad.ctaButton}</strong>
        </p>

        <h3>The lead form</h3>
        <p>When someone taps {ad.ctaButton} they fill in:</p>
        <ul>
          {ad.leadFormFields.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p>
          That form lands in Meta first. By next Monday it will also ping straight
          to your WhatsApp via Impact.
        </p>

        <h3>What I am adding this week</h3>
        <ul>
          {ad.thisWeekAdditions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>

        {ad.knownQuirks.length > 0 && (
          <>
            <h3>One thing to know</h3>
            {ad.knownQuirks.map((q, i) => (
              <p key={i}>{q}</p>
            ))}
          </>
        )}
      </PageShell>

      {/* PAGE 6 — TOOLS */}
      <PageShell number={6} title="Your Tools">
        <p>Two apps. That is it.</p>

        <h3>Meta Ads Manager (live now)</h3>
        <p>
          This is where the ads themselves live. You can see spend, leads,
          performance, anytime, on your phone.
        </p>
        <ul>
          <li>Download: Meta Ads Manager from the App Store</li>
          <li>Login: same as your {c.name} Facebook page login</li>
          <li>
            What to look at: the Campaigns tab. You will see {ad.campaignName} with
            live numbers.
          </li>
        </ul>
        <p>
          What is normal: cost per lead bouncing around in week 1. £15 one day,
          £40 the next. This averages out by week 3.
        </p>
        <p>
          What is not normal: zero impressions for 2 days straight, or &ldquo;ad
          rejected&rdquo; status. Both of those are my problem to fix, just WhatsApp
          me.
        </p>

        <h3>Impact (live from week 2)</h3>
        <p>
          This is the AM:PM Media dashboard. It pulls every lead, every ad, every
          message, every booking into one place. From week 2 onwards, every lead
          form submission triggers a WhatsApp ping to your phone within 5 seconds.
        </p>
        <p>
          You will get an invite link by email. Use it on your phone (works in
          browser, no download needed). Bookmark it on your home screen.
        </p>
        <p>What it does for you:</p>
        <ul>
          <li>
            5 second WhatsApp alert with the lead&apos;s details and an AI confidence
            score (1 to 10, how serious the lead looks)
          </li>
          <li>
            All messages from Facebook, Instagram, WhatsApp, and email in one
            inbox so you do not lose anything
          </li>
          <li>
            Automatic follow-up if you forget to reply (this catches money you
            would otherwise lose)
          </li>
          <li>
            Live ROI tracking so you can see exactly what every £1 of ad spend
            earned you
          </li>
        </ul>

        <h3>What you do not need</h3>
        <ul>
          <li>A laptop</li>
          <li>A new phone</li>
          <li>A CRM</li>
          <li>A spreadsheet</li>
          <li>An assistant</li>
          <li>A bookkeeper plugin</li>
          <li>Anything you do not already have</li>
        </ul>
      </PageShell>

      {/* PAGE 7 — WHEN A LEAD COMES IN */}
      <PageShell number={7} title="When a Lead Comes In">
        <p>
          Read this page twice. This is where most {c.industryNoun} lose money.
        </p>

        <h3>The 5 minute window</h3>
        <p>
          Studies (and the entire reason Impact exists) say a lead replied to
          within 5 minutes is up to 9 times more likely to convert than one
          replied to within an hour. After 24 hours, the lead is functionally
          dead. They have moved on, called your competitor, or forgotten.
        </p>
        <p>
          You do not need to do a 30 minute consultation in 5 minutes. You just
          need to send one message. &ldquo;Hi [name], got your enquiry, I&apos;ll
          be back to you within the hour with details.&rdquo; That message alone,
          sent in under 5 minutes, doubles your close rate.
        </p>

        <h3>What you will see</h3>
        <p>
          A WhatsApp ping with the lead&apos;s name, postcode, what they want, and
          (once Impact is live) a 1 to 10 confidence score. 8+ means jump on it.
          5 to 7 means good lead, normal pace. Below 5 means probable timewaster,
          low priority.
        </p>

        <h3>What to send first</h3>
        <p>
          Use this exact template (or save it as a WhatsApp quick reply):
        </p>
        <blockquote>
          <p>{lh.firstReply}</p>
        </blockquote>
        <p>
          Three things this does. It introduces you (trust). It commits to{' '}
          {lh.keyPromise} (their main worry). It asks one closed question (cuts
          the back and forth).
        </p>

        <h3>What not to do</h3>
        <ul>
          <li>Do not reply 6 hours later &ldquo;saw your message&rdquo;</li>
          <li>Do not send 4 messages in a row</li>
          <li>
            Do not ask for {lh.industrySpecificDetail} before you have introduced
            yourself
          </li>
          <li>
            Do not quote on WhatsApp before you have {lh.industryPreQuoteStep}
          </li>
          <li>
            Do not vanish if they say &ldquo;thanks I&apos;ll think about it&rdquo;
            - send the day 2 follow-up
          </li>
        </ul>

        <h3>Day 2 follow-up (auto-sent by Impact from week 2)</h3>
        <blockquote>
          <p>{lh.day2Followup}</p>
        </blockquote>

        <h3>Day 5 follow-up (auto-sent by Impact)</h3>
        <blockquote>
          <p>{lh.day5Followup}</p>
        </blockquote>
        <p>
          That last message catches roughly 1 in 5 leads who would otherwise be
          lost.
        </p>
      </PageShell>

      {/* PAGE 8 — WEEKLY RHYTHM */}
      <PageShell number={8} title="Your Weekly Rhythm">
        <p>
          Same shape every week. Predictable on purpose so you know what to
          expect.
        </p>

        <h3>Monday morning (from me)</h3>
        <p>A WhatsApp message with last week&apos;s numbers.</p>
        <ul>
          <li>Spend</li>
          <li>Leads</li>
          <li>Cost per lead</li>
          <li>What&apos;s winning</li>
          <li>What&apos;s losing</li>
          <li>What I&apos;m doing this week</li>
        </ul>
        <p>It will be short. 5 lines. Not a lecture.</p>

        <h3>Tuesday to Friday (you)</h3>
        <ul>
          <li>Reply to leads (5 minute target)</li>
          <li>Send me any new job photos for ad creative (1 photo a week is plenty)</li>
          <li>WhatsApp me if anything looks off</li>
        </ul>

        <h3>Friday (from me)</h3>
        <p>
          A check in. &ldquo;All good your end this week?&rdquo; The point is so you
          raise concerns early not late.
        </p>

        <h3>Monthly (start of month 2 and 3)</h3>
        <p>
          A 30 minute call. Voice or video, your choice. We look at the numbers,
          agree the next month&apos;s strategy, and adjust budget if it makes
          sense.
        </p>

        <h3>What I will never do</h3>
        <ul>
          <li>Send you a 6 page PDF report you do not have time to read</li>
          <li>Bury bad news in good news</li>
          <li>Charge for &ldquo;extra&rdquo; work that should be included</li>
          <li>Disappear for a week and tell you &ldquo;everything&apos;s running&rdquo;</li>
          <li>Use jargon to look smart</li>
        </ul>
        <p>
          If something is broken I will tell you it is broken. If something is
          winning I will tell you it is winning. If I am about to spend more of
          your money I will ask first.
        </p>
      </PageShell>

      {/* PAGE 9 — WHAT I NEED */}
      <PageShell number={9} title="What I Need From You">
        <p>Short list. Most of it is one-off, not weekly.</p>

        <h3>This week</h3>
        <ul className="checklist">
          {pack.asks.thisWeek.map((a) => (
            <li key={a.text} className={a.done ? 'done' : undefined}>
              {a.text}
              {a.done && <span className="done-tag">done</span>}
            </li>
          ))}
        </ul>

        <h3>Next 2 weeks</h3>
        <ul className="checklist">
          {pack.asks.next2Weeks.map((a) => (
            <li key={a.text} className={a.done ? 'done' : undefined}>
              {a.text}
              {a.done && <span className="done-tag">done</span>}
            </li>
          ))}
        </ul>

        <h3>Ongoing</h3>
        <ul>
          <li>
            24 hour turnaround on creative approvals (a thumbs up on WhatsApp is
            approval)
          </li>
          <li>
            Heads up if you are going on holiday or off-grid for more than 2
            days, so I can pause ads and not waste spend on leads you cannot
            answer
          </li>
        </ul>

        <h3>Things to ask the customer for, over time (these are FAQ gaps)</h3>
        <p>
          Whenever you have a moment, drop me answers to these. Each one becomes
          ad copy, FAQ content, or LLM SEO blog material.
        </p>
        <ul>
          {pack.asks.faqGaps.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p>
          The more answers you can give me, the more we can pre-qualify leads,
          write better ads, and feed Google + ChatGPT search results.
        </p>
      </PageShell>

      {/* PAGE 10 — FAQ */}
      <PageShell number={10} title="Your FAQ (and Why it Matters)">
        <p>
          These are the answers you gave on the call. They power your ads, your
          future website, and the way Google and ChatGPT recommend you.
        </p>

        <table className="faq-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Answer</th>
            </tr>
          </thead>
          <tbody>
            {pack.faq.map((row) => (
              <tr key={row.q}>
                <td>{row.q}</td>
                <td>{row.a}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Where these show up</h3>

        <p>
          <strong>1. In your ads.</strong> Each FAQ becomes a one-line headline.
        </p>
        <ul>
          {pack.faq
            .filter((f) => f.adHeadline)
            .map((f) => (
              <li key={f.q}>&ldquo;{f.adHeadline}&rdquo;</li>
            ))}
        </ul>

        <p>
          <strong>2. In your auto-replies.</strong> When a lead comes in, the day
          2 follow-up uses these directly to answer the most common worry without
          you needing to type.
        </p>

        <p>
          <strong>3. In your future website.</strong> When AM:PM builds you a site
          (month 4 or 5 if numbers land), these become a proper FAQ page with
          structured data so Google shows the answer directly.
        </p>

        <p>
          <strong>4. In LLM search.</strong> This is the new one. Customers
          increasingly ask ChatGPT, Claude, Perplexity &ldquo;{pack.llmSearchExample}&rdquo;
          or similar. If your FAQ page is structured the right way, those AI
          tools recommend YOU instead of a competitor. We build for this from day
          one. It is called LLM SEO, and AM:PM bakes it into every retainer.
        </p>

        <p>
          The questions above will eventually become short blog posts (500 to 800
          words each). Each one is written so an AI like ChatGPT will quote it
          when a customer asks. That is how {c.name} starts being recommended in
          conversations you cannot see.
        </p>
        <p>You do not write them. I do. You just keep answering the customer questions so I have material.</p>
      </PageShell>

      {/* PAGE 11 — WHEN THINGS GO WRONG */}
      <PageShell number={11} title="When Things Go Wrong">
        <p>This page exists so you know nothing on this list is a crisis.</p>

        <h3>&ldquo;My ad got rejected&rdquo;</h3>
        <p>
          Happens. Meta auto-flags about 1 in 20 ads, often for nothing real. I
          resubmit with a small tweak. Live again within 24 hours. You do nothing.
        </p>

        <h3>&ldquo;Spend looks weird&rdquo;</h3>
        <p>
          Meta sometimes spends 2 days of budget in 1 day, then under-spends the
          next 2. It evens out across the week. The campaign is set to a weekly
          cap so you cannot be overcharged.
        </p>

        <h3>&ldquo;Zero leads for 3 days&rdquo;</h3>
        <p>
          In week 1, expected. In week 4, I&apos;m investigating. Could be ad
          fatigue, audience saturation, or a Facebook outage. I check, I report,
          I fix.
        </p>

        <h3>&ldquo;A lead said something weird&rdquo;</h3>
        <p>
          Forward it to me. Spam, abuse, scammers, time-wasters all happen. Some
          of them I can block at the form level. Most are background noise.
        </p>

        <h3>&ldquo;Meta locked the account&rdquo;</h3>
        <p>
          Rare but possible. Common causes are payment issues or Instagram
          pay-or-consent. I have a checklist for this. Restored same day in most
          cases.
        </p>

        <h3>&ldquo;I want to pause for a week&rdquo;</h3>
        <p>
          Tell me. I pause spend that day, no penalty, no admin fee. We restart
          when you are back.
        </p>

        <h3>&ldquo;I cannot answer leads fast enough&rdquo;</h3>
        <p>
          Tell me. We can dial spend down to slow leads, or activate Impact&apos;s
          AI Receptionist (£400/mo add-on) which answers and qualifies for you 24/7.
          Better problem to have than no leads.
        </p>

        <h3>&ldquo;I am not sure this is working&rdquo;</h3>
        <p>
          Tell me. Always. We never let it run to month 3 with you sitting on
          doubt. The whole point of weekly billing is you raise it early, we
          adjust early, no one is stuck.
        </p>

        <h3>&ldquo;Something I do not understand happened&rdquo;</h3>
        <p>
          Screenshot. WhatsApp. I will explain it in plain language and tell you
          whether it matters.
        </p>

        <p>
          There is no question too small. No issue too obvious. The reason this
          works is that you tell me when things feel wrong, and I tell you the
          truth about what is happening.
        </p>
      </PageShell>

      {/* PAGE 12 — BEYOND MONTH 3 */}
      <PageShell number={12} title="Beyond Month 3">
        <p>What month 4 onwards looks like if the numbers land.</p>

        <h3>Month 4 — Move to Impact Core (£1,500/mo)</h3>
        <p>
          Full Impact dashboard. Outbound SMS / WhatsApp campaigns. Booking
          funnel live. Cal.com integrated so leads can book themselves.
          Reputation management (Google reviews automation). Ad spend stays
          separate at whatever rate is working.
        </p>

        <h3>Month 5 — Website</h3>
        <p>Proper {c.name} website. Built by AM:PM Creative. Covers:</p>
        <ul>
          <li>Homepage with the live ad assets</li>
          <li>{r.keyLandingPage}</li>
          <li>Project gallery (your photos, organised)</li>
          <li>FAQ page with structured data for LLM SEO</li>
          <li>Blog with the LLM SEO posts (and 1 new post per month)</li>
          <li>Local pages: {r.websiteLocalPages.join(', ')}</li>
        </ul>
        <p>This is included in your retainer once you are on Impact Core, not a separate invoice.</p>

        <h3>Month 6 — Content engine</h3>
        <p>AM:PM Vision (the content side) does a half day shoot at one of your jobs. We get:</p>
        <ul>
          <li>5 to 10 reels for Instagram / TikTok</li>
          <li>3 to 5 ad-ready vertical videos</li>
          <li>A long-form video for the website</li>
          <li>50+ photos for ad rotation</li>
        </ul>
        <p>You stop relying on phone clips. Content lasts you 3 to 6 months.</p>

        <h3>Month 9 — Geographic expansion</h3>
        <p>
          If {c.city} is saturated we open {r.expansionCity1}, then{' '}
          {r.expansionCity2}. Same playbook, different city.
        </p>

        <h3>Month 12 — Where you should be</h3>
        <ul>
          <li>£{fmtMoney(r.year1RevenueLow)} to £{fmtMoney(r.year1RevenueHigh)}+ a month consistent</li>
          <li>{r.teamGrowthGoal}</li>
          <li>A waiting list, not a chase</li>
          <li>A site that ranks</li>
          <li>LLMs recommending you when people ask</li>
          <li>AM:PM as your full marketing arm</li>
        </ul>
        <p>That is the plan. We get there if we get the first 3 months right. Page 1 to 11 is how we do that.</p>
      </PageShell>

      {/* CLOSING */}
      <footer className="mx-auto w-full max-w-3xl border-t border-navy/10 px-6 py-16 sm:px-10 print:break-before-page">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-impact">
          Direct line
        </span>
        <p className="mt-4 text-lg text-navy/80">WhatsApp Colm anytime.</p>
        <p className="mt-8 font-display text-2xl font-semibold text-navy">
          AM:PM Media
        </p>
        <p className="text-sm text-navy/60">
          : Creative + : Vision + : Impact + : Studio
          <br />
          Glasgow
        </p>
        <p className="mt-12 text-xs uppercase tracking-[0.2em] text-navy/40">
          End of pack
        </p>
      </footer>
    </article>
  )
}
