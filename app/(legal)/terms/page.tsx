import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | : Impact',
  description: 'Terms of Service for : Impact by AM:PM Media LTD',
}

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-[#0C1220] mb-2">Terms of Service</h1>
        <p className="text-[#0C1220]/50 mb-8">Last updated: 24 February 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-[#0C1220]/80 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">1. Agreement to Terms</h2>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the : Impact platform
              (&ldquo;Service&rdquo;) operated by AM:PM Media LTD, a company registered in England and Wales
              (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
            </p>
            <p>
              By accessing or using the Service, you agree to be bound by these Terms. If you do not agree,
              you may not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">2. Description of Service</h2>
            <p>
              : Impact is a lead management platform that enables businesses to capture, qualify, and manage
              leads from advertising platforms and other sources. The Service includes features such as:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Lead capture from Meta Ads, web forms, and third-party integrations</li>
              <li>AI-powered lead qualification and scoring</li>
              <li>Real-time notifications via email and WhatsApp</li>
              <li>Appointment scheduling and calendar integrations</li>
              <li>Reporting and analytics dashboards</li>
              <li>Conversation management across multiple channels</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">3. Account Registration</h2>
            <p>
              Access to the Service is provided by invitation or account creation by an authorised administrator.
              You are responsible for maintaining the confidentiality of your account credentials and for all
              activities that occur under your account.
            </p>
            <p>
              You must provide accurate and complete information when your account is set up and keep this
              information up to date. You must notify us immediately at{' '}
              <a href="mailto:hello@mediampm.com" className="text-[#6E0F1A] hover:underline">hello@mediampm.com</a>{' '}
              if you become aware of any unauthorised use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service for any unlawful purpose or in violation of applicable laws</li>
              <li>Upload or transmit malicious code, viruses, or harmful data</li>
              <li>Attempt to gain unauthorised access to any part of the Service</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Use the Service to send unsolicited communications (spam)</li>
              <li>Resell, sublicense, or redistribute the Service without written consent</li>
              <li>Scrape, crawl, or use automated means to access the Service except via our APIs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">5. Data and Content</h2>
            <p>
              You retain ownership of all data you submit to the Service (&ldquo;Your Data&rdquo;). By using the
              Service, you grant us a limited licence to process Your Data solely for the purpose of
              providing and improving the Service.
            </p>
            <p>
              You are responsible for ensuring that you have all necessary rights and consents to
              upload and process personal data through the Service, including compliance with applicable
              data protection laws such as the UK GDPR and the Data Protection Act 2018.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">6. Subscription and Payment</h2>
            <p>
              Access to the Service is provided on a subscription basis. Subscription terms, pricing,
              and payment schedules will be agreed separately between you and AM:PM Media LTD. Failure
              to make timely payments may result in suspension or termination of your access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">7. Third-Party Integrations</h2>
            <p>
              The Service may integrate with third-party platforms including Meta (Facebook/Instagram),
              Calendly, Cal.com, Stripe, Xero, Twilio, and others. Your use of these integrations is
              subject to the respective third party&apos;s terms of service. We are not responsible for
              the availability, accuracy, or conduct of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, AM:PM Media LTD shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, including but not
              limited to loss of profits, data, or business opportunities, arising out of or related
              to your use of the Service.
            </p>
            <p>
              Our total aggregate liability shall not exceed the amounts paid by you to us in the
              twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">9. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind,
              whether express or implied, including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, and non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">10. Termination</h2>
            <p>
              Either party may terminate the agreement at any time with 30 days&apos; written notice.
              We may suspend or terminate your access immediately if you breach these Terms. Upon
              termination, we will provide you with an opportunity to export Your Data within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">11. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes
              by email or through the Service. Your continued use of the Service after changes are
              posted constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">12. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of England and Wales.
              Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of
              the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0C1220] mt-8 mb-3">13. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at:{' '}
              <a href="mailto:hello@mediampm.com" className="text-[#6E0F1A] hover:underline">hello@mediampm.com</a>
            </p>
            <p className="mt-2">
              AM:PM Media LTD<br />
              United Kingdom
            </p>
          </section>
        </div>

        {/* Footer links */}
        <div className="mt-12 pt-8 border-t border-[#0C1220]/10 flex items-center justify-between text-sm text-[#0C1220]/40">
          <p>&copy; {new Date().getFullYear()} AM:PM Media LTD. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-[#0C1220]/60 transition-colors font-medium text-[#0C1220]/60">Terms</Link>
            <Link href="/privacy" className="hover:text-[#0C1220]/60 transition-colors">Privacy</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
