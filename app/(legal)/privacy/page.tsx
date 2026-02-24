import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | : Impact',
  description: 'Privacy Policy for : Impact by AM:PM Media LTD',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <header className="bg-[#0C1220] py-6">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between">
          <Link href="/login" className="text-[#FAF8F5] font-bold text-xl">
            <span className="text-[#6E0F1A]">:</span> Impact
          </Link>
          <Link href="/login" className="text-[#FAF8F5]/60 text-sm hover:text-[#FAF8F5] transition-colors">
            Back to Login
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-[#0C1220] mb-2">Privacy Policy</h1>
        <p className="text-[#0C1220]/50 mb-8">Last updated: 24 February 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-[#0C1220]/80 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">1. Introduction</h2>
            <p>
              AM:PM Media LTD (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to protecting
              your privacy. This Privacy Policy explains how we collect, use, store, and protect personal data
              when you use the : Impact platform (&ldquo;Service&rdquo;).
            </p>
            <p>
              We are the data controller for the personal data we process in connection with the Service.
              For lead data you upload or capture through the Service, you are the data controller and we
              act as your data processor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">2. Data We Collect</h2>

            <h3 className="text-lg font-medium text-[#0C1220] mt-4 mb-2">2.1 Account Data</h3>
            <p>When your account is created, we collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number (optional)</li>
              <li>Business/organisation name</li>
              <li>Password (securely hashed)</li>
            </ul>

            <h3 className="text-lg font-medium text-[#0C1220] mt-4 mb-2">2.2 Lead Data</h3>
            <p>Through your use of the Service, you may capture and store lead data including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Names, email addresses, and phone numbers of your leads/prospects</li>
              <li>Lead source and marketing attribution data (UTM parameters)</li>
              <li>Conversation history (SMS, email, WhatsApp, social media)</li>
              <li>Appointment and scheduling information</li>
              <li>Payment status and amounts</li>
              <li>AI-generated qualification scores and summaries</li>
            </ul>

            <h3 className="text-lg font-medium text-[#0C1220] mt-4 mb-2">2.3 Usage Data</h3>
            <p>We automatically collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>IP address and browser information</li>
              <li>Pages visited and features used</li>
              <li>Timestamps of access and actions</li>
            </ul>

            <h3 className="text-lg font-medium text-[#0C1220] mt-4 mb-2">2.4 Integration Data</h3>
            <p>
              When you connect third-party services (Meta Ads, Calendly, Cal.com, Stripe, Xero, etc.),
              we store OAuth access tokens (encrypted using AES-256-GCM) and account identifiers
              necessary to maintain the connection.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">3. How We Use Your Data</h2>
            <p>We use personal data for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Providing the Service</strong> &mdash; managing your account, processing leads, sending notifications</li>
              <li><strong>AI Processing</strong> &mdash; qualifying leads using AI (Anthropic Claude). Lead data is sent to the AI model for scoring and summarisation. Anthropic does not use this data for model training.</li>
              <li><strong>Communications</strong> &mdash; sending transactional emails (via Resend), SMS (via Twilio), and WhatsApp notifications (via Meta Cloud API)</li>
              <li><strong>Reporting</strong> &mdash; generating performance reports and analytics for your organisation</li>
              <li><strong>Security</strong> &mdash; detecting and preventing fraud, abuse, and unauthorised access</li>
              <li><strong>Improvement</strong> &mdash; analysing usage patterns to improve the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">4. Legal Basis for Processing</h2>
            <p>Under the UK GDPR, we process personal data on the following legal bases:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Contract</strong> &mdash; processing necessary to perform our agreement with you</li>
              <li><strong>Legitimate interests</strong> &mdash; improving our Service, preventing fraud, ensuring security</li>
              <li><strong>Consent</strong> &mdash; where you have given explicit consent (e.g., connecting third-party integrations)</li>
              <li><strong>Legal obligation</strong> &mdash; where processing is required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">5. Third-Party Services</h2>
            <p>We share data with the following categories of third-party services to operate the Service:</p>
            <table className="w-full text-sm mt-3 border-collapse">
              <thead>
                <tr className="border-b border-[#0C1220]/10">
                  <th className="text-left py-2 pr-4 font-semibold text-[#0C1220]">Provider</th>
                  <th className="text-left py-2 pr-4 font-semibold text-[#0C1220]">Purpose</th>
                  <th className="text-left py-2 font-semibold text-[#0C1220]">Data Shared</th>
                </tr>
              </thead>
              <tbody className="text-[#0C1220]/70">
                <tr className="border-b border-[#0C1220]/5">
                  <td className="py-2 pr-4">Supabase (US/EU)</td>
                  <td className="py-2 pr-4">Database &amp; authentication</td>
                  <td className="py-2">All account and lead data</td>
                </tr>
                <tr className="border-b border-[#0C1220]/5">
                  <td className="py-2 pr-4">Vercel (US)</td>
                  <td className="py-2 pr-4">Hosting &amp; deployment</td>
                  <td className="py-2">Request logs, IP addresses</td>
                </tr>
                <tr className="border-b border-[#0C1220]/5">
                  <td className="py-2 pr-4">Anthropic (US)</td>
                  <td className="py-2 pr-4">AI lead qualification</td>
                  <td className="py-2">Lead names, contact info, notes</td>
                </tr>
                <tr className="border-b border-[#0C1220]/5">
                  <td className="py-2 pr-4">Resend (US)</td>
                  <td className="py-2 pr-4">Email delivery</td>
                  <td className="py-2">Email addresses, email content</td>
                </tr>
                <tr className="border-b border-[#0C1220]/5">
                  <td className="py-2 pr-4">Meta (US)</td>
                  <td className="py-2 pr-4">WhatsApp notifications, ad data</td>
                  <td className="py-2">Phone numbers, lead names</td>
                </tr>
                <tr className="border-b border-[#0C1220]/5">
                  <td className="py-2 pr-4">Twilio (US)</td>
                  <td className="py-2 pr-4">SMS messaging</td>
                  <td className="py-2">Phone numbers, message content</td>
                </tr>
                <tr className="border-b border-[#0C1220]/5">
                  <td className="py-2 pr-4">Trigger.dev (EU)</td>
                  <td className="py-2 pr-4">Background job processing</td>
                  <td className="py-2">Lead IDs, task payloads</td>
                </tr>
                <tr className="border-b border-[#0C1220]/5">
                  <td className="py-2 pr-4">Stripe (US)</td>
                  <td className="py-2 pr-4">Payment processing</td>
                  <td className="py-2">Payment amounts, customer references</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">6. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. Lead data is retained
              for the duration of your subscription. Upon account termination, we will delete or anonymise
              your data within 90 days, unless we are required to retain it by law.
            </p>
            <p>
              You may request deletion of your data at any time by contacting us at{' '}
              <a href="mailto:hello@mediampm.com" className="text-[#6E0F1A] hover:underline">hello@mediampm.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">7. Data Security</h2>
            <p>We implement appropriate technical and organisational measures to protect personal data, including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Encryption of data in transit (TLS/HTTPS) and sensitive data at rest (AES-256-GCM for OAuth tokens)</li>
              <li>Row-Level Security (RLS) in our database to ensure organisation-level data isolation</li>
              <li>Authentication via Supabase Auth with secure session management</li>
              <li>HMAC signature verification on webhook endpoints</li>
              <li>Regular security reviews of our codebase</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">8. International Data Transfers</h2>
            <p>
              Some of our third-party providers are based in the United States. Where personal data is
              transferred outside the UK, we ensure appropriate safeguards are in place, including
              Standard Contractual Clauses (SCCs) or adequacy decisions by the UK government.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">9. Your Rights</h2>
            <p>Under the UK GDPR, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access</strong> &mdash; request a copy of the personal data we hold about you</li>
              <li><strong>Rectification</strong> &mdash; request correction of inaccurate data</li>
              <li><strong>Erasure</strong> &mdash; request deletion of your data (&ldquo;right to be forgotten&rdquo;)</li>
              <li><strong>Restriction</strong> &mdash; request we limit processing of your data</li>
              <li><strong>Portability</strong> &mdash; receive your data in a structured, machine-readable format</li>
              <li><strong>Object</strong> &mdash; object to processing based on legitimate interests</li>
              <li><strong>Withdraw consent</strong> &mdash; where processing is based on consent</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:hello@mediampm.com" className="text-[#6E0F1A] hover:underline">hello@mediampm.com</a>.
              We will respond within 30 days.
            </p>
            <p className="mt-2">
              You also have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO)
              at{' '}
              <a href="https://ico.org.uk" className="text-[#6E0F1A] hover:underline" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">10. Cookies</h2>
            <p>
              The Service uses essential cookies for authentication and session management. These cookies
              are strictly necessary for the Service to function and cannot be disabled. We do not use
              tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes
              by email or through the Service. The &ldquo;Last updated&rdquo; date at the top indicates the most
              recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">12. Contact Us</h2>
            <p>
              For any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <p className="mt-2">
              AM:PM Media LTD<br />
              Email:{' '}
              <a href="mailto:hello@mediampm.com" className="text-[#6E0F1A] hover:underline">hello@mediampm.com</a>
            </p>
          </section>
        </div>

        {/* Footer links */}
        <div className="mt-12 pt-8 border-t border-[#0C1220]/10 flex items-center justify-between text-sm text-[#0C1220]/40">
          <p>&copy; {new Date().getFullYear()} AM:PM Media LTD. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-[#0C1220]/60 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-[#0C1220]/60 transition-colors font-medium text-[#0C1220]/60">Privacy</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
